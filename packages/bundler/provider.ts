import address from "~packages/util/address"
import number from "~packages/util/number"
import type { BigNumberish, HexString, Nullable } from "~typing"

import { JsonRpcProvider } from "../rpc/json/provider"
import { EntryPointVersion } from "./index"
import { BundlerRpcMethod } from "./rpc"
import {
  UserOperationV0_6,
  type UserOperationDataV0_6
} from "./userOperation/v0_6"
import {
  UserOperationV0_7,
  type UserOperationDataV0_7
} from "./userOperation/v0_7"

type UserOperation = UserOperationV0_6 | UserOperationV0_7
type UserOperationData = UserOperationDataV0_6 | UserOperationDataV0_7

export enum BundlerMode {
  Manual = "manual",
  Auto = "auto"
}

export class BundlerProvider {
  public readonly url: string

  private bundler: JsonRpcProvider
  private entryPoint: {
    [v in EntryPointVersion]: HexString
  }
  private mode: BundlerMode = BundlerMode.Auto

  public constructor(option: {
    url: string
    entryPoint: {
      [v in EntryPointVersion]: HexString
    }
    mode?: BundlerMode
  }) {
    this.url = option.url
    this.bundler = new JsonRpcProvider(option.url)
    this.entryPoint = option.entryPoint
    if (option.mode) {
      this.mode = option.mode
    }
  }

  public async getChainId(): Promise<bigint> {
    const chainId = await this.bundler.send<HexString>({
      method: BundlerRpcMethod.eth_chainId
    })
    return number.toBigInt(chainId)
  }

  public async getSupportedEntryPoints(): Promise<HexString[]> {
    const entryPoints = await this.bundler.send<HexString[]>({
      method: BundlerRpcMethod.eth_supportedEntryPoints
    })
    return entryPoints
  }

  public async isSupportedEntryPoint(entryPoint: HexString): Promise<boolean> {
    const entryPoints = await this.getSupportedEntryPoints()
    return (
      entryPoints.filter((ep) => address.isEqual(entryPoint, ep)).length > 0
    )
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
    // Even if the data is not null, blockNumber, blockHash, and transactionHash
    // remain null until the transaction is fully broadcasted.
    if (!data) {
      return null
    }
    return {
      ...data,
      userOperation: this.deriveUserOperation(data.userOperation),
      ...(data.blockNumber && {
        blockNumber: number.toBigInt(data.blockNumber)
      })
    }
  }

  public async getUserOperationReceipt(userOpHash: HexString): Promise<{
    success: boolean
    reason: string
    receipt: {
      transactionHash: HexString
      blockHash: HexString
      blockNumber: BigNumberish
    }
  }> {
    const receipt = await this.bundler.send<{
      success: boolean
      reason: string
      receipt: {
        transactionHash: HexString
        blockHash: HexString
        blockNumber: BigNumberish
      }
    }>({
      method: BundlerRpcMethod.eth_getUserOperationReceipt,
      params: [userOpHash]
    })
    return receipt
  }

  public async estimateUserOperationGas(
    userOp: UserOperation,
    entryPoint: HexString
  ): Promise<{
    preVerificationGas: bigint
    verificationGasLimit: bigint
    callGasLimit: bigint
    paymasterVerificationGasLimit: bigint
  }> {
    const gasLimit = await this.bundler.send<{
      preVerificationGas: HexString
      verificationGasLimit: HexString
      callGasLimit: HexString
      paymasterVerificationGasLimit: HexString
    }>({
      method: BundlerRpcMethod.eth_estimateUserOperationGas,
      params: [userOp.data(), entryPoint]
    })
    return {
      preVerificationGas: number.toBigInt(gasLimit.preVerificationGas),
      verificationGasLimit: number.toBigInt(gasLimit.verificationGasLimit),
      callGasLimit: number.toBigInt(gasLimit.callGasLimit),
      paymasterVerificationGasLimit: number.toBigInt(
        gasLimit.paymasterVerificationGasLimit ?? "0x0"
      )
    }
  }

  public async sendUserOperation(
    userOp: UserOperation,
    entryPoint: HexString
  ): Promise<HexString> {
    const userOpHash = await this.bundler.send<HexString>({
      method: BundlerRpcMethod.eth_sendUserOperation,
      params: [userOp.data(), entryPoint]
    })
    if (this.mode === BundlerMode.Manual) {
      await this.debugSendBundleNow()
    }
    return userOpHash
  }

  public async send<T>(args: { method: string; params?: any[] }): Promise<T> {
    return this.bundler.send(args) as T
  }

  public async wait(userOpHash: HexString): Promise<HexString> {
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

  /* private */

  private async debugSendBundleNow() {
    await this.bundler.send({
      method: BundlerRpcMethod.debug_bundler_sendBundleNow
    })
  }

  private deriveUserOperation(data: UserOperationData) {
    if ("factory" in data) {
      return new UserOperationV0_7(data)
    }
    return new UserOperationV0_6(data)
  }
}
