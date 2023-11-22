import type { BigNumberish, HexString, Nullable } from "~typings"

import { JsonRpcProvider } from "../rpc/json/provider"
import { BundlerRpcMethod } from "./rpc"

export enum BundlerMode {
  Manual = "manual",
  Auto = "auto"
}

export type UserOperation = {
  sender: HexString
  nonce: BigNumberish
  initCode: HexString
  callData: HexString
  callGasLimit: BigNumberish
  verificationGasLimit: BigNumberish
  preVerificationGas: BigNumberish
  maxFeePerGas: BigNumberish
  maxPriorityFeePerGas: BigNumberish
  paymasterAndData: HexString
  signature: HexString
}

export class BundlerProvider extends JsonRpcProvider {
  public constructor(
    bundlerRpcUrl: string,
    private mode: BundlerMode = BundlerMode.Auto
  ) {
    super(bundlerRpcUrl)
  }

  public async getChainId(): Promise<HexString> {
    const chainId = this.send({
      method: BundlerRpcMethod.eth_chainId
    })
    return chainId
  }

  public async getSupportedEntryPoints(): Promise<HexString[]> {
    const entryPointAddresses = this.send({
      method: BundlerRpcMethod.eth_supportedEntryPoints
    })
    return entryPointAddresses
  }

  public async estimateUserOperationGas(
    userOp: Partial<UserOperation>,
    entryPointAddress: HexString
  ): Promise<{
    preVerificationGas: HexString
    verificationGasLimit: HexString
    callGasLimit: HexString
  }> {
    const gasLimits = this.send({
      method: BundlerRpcMethod.eth_estimateUserOperationGas,
      params: [userOp, entryPointAddress]
    })
    return gasLimits
  }

  public async sendUserOperation(
    userOp: UserOperation,
    entryPointAddress: HexString
  ): Promise<HexString> {
    const userOpHash = this.send({
      method: BundlerRpcMethod.eth_sendUserOperation,
      params: [userOp, entryPointAddress]
    })
    return userOpHash
  }

  public async wait(userOpHash: HexString): Promise<HexString> {
    if (this.mode === BundlerMode.Manual) {
      await this.debugSendBundleNow()
    }
    while (true) {
      const res = await new Promise<
        Nullable<{
          transactionHash: HexString
        }>
      >((resolve) => {
        setTimeout(async () => {
          resolve(
            await this.send({
              method: BundlerRpcMethod.eth_getUserOperationByHash,
              params: [userOpHash]
            })
          )
        }, 1000)
      })
      if (res) {
        return res.transactionHash
      }
    }
  }

  private async debugSendBundleNow() {
    await this.send({
      method: BundlerRpcMethod.debug_bundler_sendBundleNow
    })
  }
}
