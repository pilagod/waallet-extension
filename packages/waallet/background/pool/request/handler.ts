import { v4 as uuidv4 } from "uuid"

import type { AccountManager } from "~packages/account/manager"
import type { UserOperation } from "~packages/bundler/userOperation"
import { GasPriceEstimator } from "~packages/gas/price/estimator"
import type { NetworkManager } from "~packages/network/manager"
import type { HexString } from "~typing"

import type { Request, RequestPool } from "./index"
import { TransactionRequest } from "./transaction"

export class RequestHandler implements RequestPool {
  private request: Record<string, Request> = {}

  public constructor(private transactionRequestHandler: RequestPool) {}

  public async send(data: {
    request: Request
    accountId: string
    networkId: string
  }) {
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
      return this.transactionRequestHandler.send(data)
    }
    throw new Error("Unknown request type to send")
  }

  private handleWait(requestId: string) {
    const request = this.request[requestId]
    if (request instanceof TransactionRequest) {
      return this.transactionRequestHandler.wait(requestId)
    }
    throw new Error("Unknown request type to wait")
  }
}

export class TransactionRequestHandler implements RequestPool {
  private pool: { [txId: string]: Promise<HexString> } = {}

  public constructor(
    private accountManager: AccountManager,
    private networkManager: NetworkManager,
    private usePaymaster?: (
      userOp: UserOperation,
      forGasEstimation: boolean
    ) => Promise<void>
  ) {}

  public async send(data: {
    request: Request
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

  public wait(txId: string) {
    return this.pool[txId]
  }
}
