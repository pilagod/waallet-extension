import { v4 as uuidv4 } from "uuid"

import type { AccountManager } from "~packages/account/manager"
import { UserOperation } from "~packages/bundler"
import type { NetworkManager } from "~packages/network/manager"
import { NodeProvider } from "~packages/node/provider"
import type { BigNumberish, HexString } from "~typing"

import type { Transaction, TransactionPool } from "./index"

export class TransactionSender implements TransactionPool {
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

    const userOp = await account.createUserOperation(tx)

    if (this.usePaymaster) {
      await this.usePaymaster(userOp, true)
    }

    if (tx.gasPrice) {
      userOp.setGasFee({
        maxFeePerGas: tx.gasPrice,
        maxPriorityFeePerGas: tx.gasPrice
      })
    } else {
      userOp.setGasFee(await this.estimateGasFee(node))
    }

    const entryPoint = await account.getEntryPoint()
    const isSupportedByBundler = await bundler.isSupportedEntryPoint(entryPoint)
    if (!isSupportedByBundler) {
      throw new Error(`Cannot support this version of EntryPoint ${entryPoint}`)
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

  private async estimateGasFee(node: NodeProvider): Promise<{
    maxFeePerGas: BigNumberish
    maxPriorityFeePerGas: BigNumberish
  }> {
    const fee = await node.getFeeData()
    const gasPriceWithBuffer = (fee.gasPrice * 120n) / 100n
    // TODO: maxFeePerGas and maxPriorityFeePerGas too low error
    return {
      maxFeePerGas: gasPriceWithBuffer,
      maxPriorityFeePerGas: gasPriceWithBuffer
    }
  }
}
