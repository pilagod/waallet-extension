import number from "~packages/util/number"
import type { HexString, Nullable } from "~typing"

import { JsonRpcProvider } from "../rpc/json/provider"
import { UserOperation } from "./index"
import { BundlerRpcMethod } from "./rpc"

export enum BundlerMode {
  Manual = "manual",
  Auto = "auto"
}

export class BundlerProvider {
  public readonly url: string

  private bundler: JsonRpcProvider

  public constructor(
    bundlerRpcUrl: string,
    private mode: BundlerMode = BundlerMode.Auto
  ) {
    this.url = bundlerRpcUrl
    this.bundler = new JsonRpcProvider(bundlerRpcUrl)
  }

  public async getChainId(): Promise<bigint> {
    const chainId = await this.bundler.send<HexString>({
      method: BundlerRpcMethod.eth_chainId
    })
    return number.toBigInt(chainId)
  }

  public async getSupportedEntryPoints(): Promise<HexString[]> {
    const entryPointAddresses = await this.bundler.send<HexString[]>({
      method: BundlerRpcMethod.eth_supportedEntryPoints
    })
    return entryPointAddresses
  }

  public async getUserOperationByHash(userOpHash: HexString): Promise<
    Nullable<{
      userOperation: UserOperation
      entryPoint: HexString
      blockNumber: bigint
      blockHash: HexString
      transactionHash: HexString
    }>
  > {
    const data = await this.bundler.send<
      Nullable<{
        userOperation: ReturnType<UserOperation["data"]>
        entryPoint: HexString
        blockNumber: HexString
        blockHash: HexString
        transactionHash: HexString
      }>
    >({
      method: BundlerRpcMethod.eth_getUserOperationByHash,
      params: [userOpHash]
    })
    if (!data) {
      return null
    }
    return {
      ...data,
      userOperation: new UserOperation(data.userOperation),
      blockNumber: number.toBigInt(data.blockHash)
    }
  }

  public async getUserOperationReceipt(userOpHash: HexString): Promise<{
    success: boolean
    reason: string
  }> {
    const receipt = await this.bundler.send<{
      success: boolean
      reason: string
    }>({
      method: BundlerRpcMethod.eth_getUserOperationReceipt,
      params: [userOpHash]
    })
    return receipt
  }

  public async estimateUserOperationGas(
    userOp: UserOperation,
    entryPointAddress: HexString
  ): Promise<{
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
  }> {
    const gasLimit = await this.bundler.send<{
      preVerificationGas: HexString
      verificationGasLimit: HexString
      callGasLimit: HexString
    }>({
      method: BundlerRpcMethod.eth_estimateUserOperationGas,
      params: [userOp.data(), entryPointAddress]
    })
    return {
      preVerificationGas: number.toBigInt(gasLimit.preVerificationGas),
      verificationGasLimit: number.toBigInt(gasLimit.verificationGasLimit),
      callGasLimit: number.toBigInt(gasLimit.callGasLimit)
    }
  }

  public async sendUserOperation(
    userOp: UserOperation,
    entryPointAddress: HexString
  ): Promise<HexString> {
    const userOpHash = await this.bundler.send<HexString>({
      method: BundlerRpcMethod.eth_sendUserOperation,
      params: [userOp.data(), entryPointAddress]
    })
    return userOpHash
  }

  public async send<T>(args: { method: string; params?: any[] }): Promise<T> {
    return this.bundler.send(args) as T
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
          resolve(await this.getUserOperationByHash(userOpHash))
        }, 1000)
      })
      if (res && res.transactionHash) {
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
