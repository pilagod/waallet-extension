import { v4 as uuidv4 } from "uuid"

import type { AccountManager } from "~packages/account/manager"
import type { UserOperation } from "~packages/bundler/userOperation"
import { GasPriceEstimator } from "~packages/gas/price/estimator"
import type { NetworkManager } from "~packages/network/manager"
import type { HexString } from "~typing"

import {
  Eip712Request,
  TransactionRequest,
  type Request,
  type RequestPool
} from "./index"

export class RequestHandler implements RequestPool {
  private request: Record<string, Request> = {}

  public constructor(
    private transactionRequestHandler: TransactionRequestHandler,
    private eip712RequestHandler: Eip712RequestHandler
  ) {}

  public async send(data: {
    request: Request
    accountId: string
    networkId: string
  }) {
    // TODO: Return id and promise
    const requestId = await this.handleSend(data)
    this.request[requestId] = data.request
    return requestId
  }

  public async wait(requestId: string) {
    const result = await this.handleWait(requestId)
    delete this.request[requestId]
    return result
  }

  /* private */

  private handleSend(data: {
    request: Request
    accountId: string
    networkId: string
  }) {
    if (data.request instanceof TransactionRequest) {
      return this.transactionRequestHandler.send({
        ...data,
        request: data.request
      })
    }
    if (data.request instanceof Eip712Request) {
      return this.eip712RequestHandler.send({ ...data, request: data.request })
    }
    throw new Error("Unknown request type to send")
  }

  private handleWait(requestId: string) {
    const request = this.request[requestId]
    if (request instanceof TransactionRequest) {
      return this.transactionRequestHandler.wait(requestId)
    }
    if (request instanceof Eip712Request) {
      return this.eip712RequestHandler.wait(requestId)
    }
    throw new Error("Unknown request type to wait")
  }
}

/* Transaction Request Handler */

export class TransactionRequestHandler {
  private pool: { [requestId: string]: Promise<HexString> } = {}

  public constructor(
    private accountManager: AccountManager,
    private networkManager: NetworkManager,
    private usePaymaster?: (
      userOp: UserOperation,
      forGasEstimation: boolean
    ) => Promise<void>
  ) {}

  public async send(data: {
    request: TransactionRequest
    accountId: string
    networkId: string
  }) {
    const { request, accountId, networkId } = data
    const { account } = await this.accountManager.get(accountId)
    const { chainId, node, bundler } = this.networkManager.get(networkId)

    const entryPoint = await account.getEntryPoint()
    const isSupportedByBundler = await bundler.isSupportedEntryPoint(entryPoint)
    if (!isSupportedByBundler) {
      throw new Error(`Cannot support this version of EntryPoint ${entryPoint}`)
    }

    const userOp = bundler.deriveUserOperation(
      await account.buildExecution(request.unwrap()),
      entryPoint
    )

    if (this.usePaymaster) {
      await this.usePaymaster(userOp, true)
    }

    if (request.gasPrice) {
      userOp.setGasFee(request.gasPrice)
    } else {
      const gasPriceEstimator = new GasPriceEstimator(node, bundler)
      userOp.setGasFee(await gasPriceEstimator.estimate())
    }

    const gas = await bundler.estimateUserOperationGas(userOp, entryPoint)
    if (request.gasLimit) {
      gas.callGasLimit = request.gasLimit
    }
    userOp.setGasLimit(gas)

    if (this.usePaymaster) {
      await this.usePaymaster(userOp, false)
    }

    userOp.setSignature(await account.sign(userOp.hash(entryPoint, chainId)))

    const userOpHash = await bundler.sendUserOperation(userOp, entryPoint)
    if (!userOpHash) {
      throw new Error("Send user operation fail")
    }
    const id = uuidv4()

    this.pool[id] = new Promise(async (resolve) => {
      const transactionHash = await bundler.wait(userOpHash)
      resolve(transactionHash)
    })

    return id
  }

  public wait(requestId: string) {
    return this.pool[requestId]
  }
}

/* EIP-712 Request Handler */

export class Eip712RequestHandler {
  private pool: { [requestId: string]: Promise<HexString> } = {}

  public constructor(private accountManager: AccountManager) {}

  public async send(data: { request: Eip712Request; accountId: string }) {
    const { request, accountId } = data
    const { account } = await this.accountManager.get(accountId)
    const id = uuidv4()
    this.pool[id] = account.sign(request.hash())
    return id
  }

  public wait(requestId: string) {
    return this.pool[requestId]
  }
}
