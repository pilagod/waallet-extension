import { v4 as uuidv4 } from "uuid"

import type { AccountManager } from "~packages/account/manager"
import type { UserOperation } from "~packages/bundler/userOperation"
import { GasPriceEstimator } from "~packages/gas/price/estimator"
import type { NetworkManager } from "~packages/network/manager"
import { NodeProvider } from "~packages/node/provider"
import type { BigNumberish, HexString } from "~typing"

import type { Transaction, TransactionPool } from "./index"

export class TransactionToUserOperationSender implements TransactionPool {
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
    tx: Transaction
    senderId: string
    networkId: string
  }) {
    const { tx, senderId, networkId } = data
    const { account } = await this.accountManager.get(senderId)
    const { chainId, node, bundler } = this.networkManager.get(networkId)

    const entryPoint = await account.getEntryPoint()
    const isSupportedByBundler = await bundler.isSupportedEntryPoint(entryPoint)
    if (!isSupportedByBundler) {
      throw new Error(`Cannot support this version of EntryPoint ${entryPoint}`)
    }

    const userOp = bundler.deriveUserOperation(
      await account.buildExecution(tx.unwrap()),
      entryPoint
    )

    if (this.usePaymaster) {
      await this.usePaymaster(userOp, true)
    }

    if (tx.gasPrice) {
      userOp.setGasFee(tx.gasPrice)
    } else {
      const gasPriceEstimator = new GasPriceEstimator(node, bundler)
      userOp.setGasFee(await gasPriceEstimator.estimate())
    }

    const gas = await bundler.estimateUserOperationGas(userOp, entryPoint)
    if (tx.gasLimit) {
      gas.callGasLimit = tx.gasLimit
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
