import { v4 as uuidv4 } from "uuid"

import type { AccountManager } from "~packages/account/manager"
import { UserOperation } from "~packages/bundler"
import type { NetworkManager } from "~packages/network/manager"
import { NodeProvider } from "~packages/node/provider"
import type { BigNumberish, HexString } from "~typing"

import type { UserOperationPool, UserOperationReceipt } from "./index"

export class UserOperationSender implements UserOperationPool {
  private pool: { [userOpHash: HexString]: Promise<UserOperationReceipt> } = {}

  public constructor(
    private accountManager: AccountManager,
    private networkManager: NetworkManager,
    private hook?: {
      beforeGasEstimation?: (userOp: UserOperation) => Promise<void>
      afterGasEstimation?: (userOp: UserOperation) => Promise<void>
    }
  ) {}

  public async send(data: {
    userOp: UserOperation
    senderId: string
    networkId: string
    entryPointAddress: HexString
  }) {
    const { userOp, senderId, networkId, entryPointAddress } = data
    const { node, bundler, chainId } = this.networkManager.get(networkId)
    const { account } = await this.accountManager.get(senderId)

    if (this.hook?.beforeGasEstimation) {
      await this.hook.beforeGasEstimation(userOp)
    }

    if (!userOp.isGasFeeEstimated()) {
      userOp.setGasFee(await this.estimateGasFee(node))
    }
    const gas = await bundler.estimateUserOperationGas(
      userOp,
      entryPointAddress
    )
    if (userOp.callGasLimit > gas.callGasLimit) {
      gas.callGasLimit = userOp.callGasLimit
    }
    userOp.setGasLimit(gas)

    if (this.hook?.afterGasEstimation) {
      await this.hook.afterGasEstimation(userOp)
    }
    userOp.setSignature(
      await account.sign(userOp.hash(entryPointAddress, chainId))
    )
    const userOpHash = await bundler.sendUserOperation(
      userOp,
      entryPointAddress
    )
    if (!userOpHash) {
      throw new Error("Send user operation fail")
    }
    const id = uuidv4()

    this.pool[id] = new Promise(async (resolve) => {
      const transactionHash = await bundler.wait(userOpHash)
      resolve({
        userOpHash: userOpHash,
        transactionHash
      })
    })

    return id
  }

  public wait(userOpId: string) {
    return this.pool[userOpId]
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
