import number from "~packages/util/number"
import type { HexString, Nullable } from "~typing"

import { JsonRpcProvider } from "../jsonrpc/provider"
import { BundlerRpcMethod } from "./rpc"
import type { UserOperation } from "./typing"

export enum BundlerMode {
  Manual = "manual",
  Auto = "auto"
}

export class BundlerProvider {
  private bundler: JsonRpcProvider

  public constructor(
    bundlerRpcUrl: string,
    private mode: BundlerMode = BundlerMode.Auto
  ) {
    this.bundler = new JsonRpcProvider(bundlerRpcUrl)
  }

  public async getChainId(): Promise<HexString> {
    const chainId = await this.bundler.send({
      method: BundlerRpcMethod.eth_chainId
    })
    return chainId
  }

  public async getSupportedEntryPoints(): Promise<HexString[]> {
    const entryPointAddresses = await this.bundler.send({
      method: BundlerRpcMethod.eth_supportedEntryPoints
    })
    return entryPointAddresses
  }

  public async getUserOperationReceipt(userOpHash: HexString): Promise<{
    success: boolean
  }> {
    const receipt = await this.bundler.send({
      method: BundlerRpcMethod.eth_getUserOperationReceipt,
      params: [userOpHash]
    })
    return receipt
  }

  public async estimateUserOperationGas(
    userOp: Partial<UserOperation>,
    entryPointAddress: HexString
  ): Promise<{
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
  }> {
    const gasLimit = await this.bundler.send({
      method: BundlerRpcMethod.eth_estimateUserOperationGas,
      params: [userOp, entryPointAddress]
    })
    for (const key of Object.keys(gasLimit)) {
      gasLimit[key] = number.toBigInt(gasLimit[key])
    }
    return gasLimit
  }

  public async sendUserOperation(
    userOp: UserOperation,
    entryPointAddress: HexString
  ): Promise<HexString> {
    const userOpHash = await this.bundler.send({
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
            await this.bundler.send({
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
    await this.bundler.send({
      method: BundlerRpcMethod.debug_bundler_sendBundleNow
    })
  }
}
