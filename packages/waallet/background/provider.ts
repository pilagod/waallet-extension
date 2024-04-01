import * as ethers from "ethers"

import { type Account } from "~packages/account"
import { UserOperation } from "~packages/bundler"
import { BundlerProvider } from "~packages/bundler/provider"
import { NetworkManager } from "~packages/network/manager"
import { NodeProvider } from "~packages/node/provider"
import { type Paymaster } from "~packages/paymaster"
import { JsonRpcProvider } from "~packages/rpc/json/provider"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

import {
  WaalletRpcMethod,
  type EthEstimateGasArguments,
  type EthEstimateUserOperationGasArguments,
  type EthSendTransactionArguments,
  type WaalletRequestArguments
} from "../rpc"
import { type UserOperationPool } from "./pool/userOperation"

export type WaalletBackgroundProviderOption = {
  paymaster?: Paymaster
  userOperationPool?: UserOperationPool
}

export class WaalletBackgroundProvider {
  public account: Account

  public constructor(
    public networkManager: NetworkManager,
    public paymaster: Paymaster,
    public userOperationPool: UserOperationPool
  ) {}

  public clone(option: WaalletBackgroundProviderOption = {}) {
    const provider = new WaalletBackgroundProvider(
      this.networkManager,
      option.paymaster ?? this.paymaster,
      option.userOperationPool ?? this.userOperationPool
    )
    if (this.account) {
      provider.connect(this.account)
    }
    return provider
  }

  public connect(account: Account) {
    this.account = account
  }

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    console.log(args)
    const { bundler, node } = this.networkManager.getActive()
    switch (args.method) {
      case WaalletRpcMethod.eth_accounts:
      case WaalletRpcMethod.eth_requestAccounts:
        return [await this.account.getAddress()] as T
      case WaalletRpcMethod.eth_chainId:
        return number.toHex(await bundler.getChainId()) as T
      case WaalletRpcMethod.eth_estimateGas:
        return this.handleEstimateGas(args.params) as T
      case WaalletRpcMethod.eth_estimateUserOperationGas:
        return this.handleEstimateUserOperationGas(args.params) as T
      case WaalletRpcMethod.eth_sendTransaction:
        return this.handleSendTransaction(args.params) as T
      default:
        return new JsonRpcProvider(node.url).send(args)
    }
  }

  private async handleEstimateGas(
    params: EthEstimateGasArguments["params"]
  ): Promise<HexString> {
    const [tx] = params
    if (!tx.to) {
      // TODO: When `to` is empty, it should estimate gas for contract creation
      return
    }
    if (
      tx.from &&
      ethers.getAddress(tx.from) !== (await this.account.getAddress())
    ) {
      throw new Error("Address `from` doesn't match connected account")
    }
    const { bundler, node } = this.networkManager.getActive()
    // TODO: Use account's entry point
    const [entryPointAddress] = await bundler.getSupportedEntryPoints()
    const userOp = await this.account.createUserOperation(node, {
      to: tx.to,
      value: tx.value,
      data: tx.data
    })
    userOp.setPaymasterAndData(
      await this.paymaster.requestPaymasterAndData(node, userOp)
    )
    if (tx.gas) {
      userOp.setCallGasLimit(tx.gas)
    }
    const { callGasLimit } = await bundler.estimateUserOperationGas(
      userOp,
      entryPointAddress
    )
    return number.toHex(callGasLimit)
  }

  private async handleEstimateUserOperationGas(
    params: EthEstimateUserOperationGasArguments["params"]
  ): Promise<{
    preVerificationGas: HexString
    verificationGasLimit: HexString
    callGasLimit: HexString
  }> {
    const { bundler, node } = this.networkManager.getActive()
    const userOp = new UserOperation(params[0])
    const [entryPointAddress] = await bundler.getSupportedEntryPoints()
    const data = await bundler.estimateUserOperationGas(
      userOp,
      entryPointAddress
    )
    return {
      preVerificationGas: number.toHex(data.preVerificationGas),
      verificationGasLimit: number.toHex(data.verificationGasLimit),
      callGasLimit: number.toHex(data.callGasLimit)
    }
  }

  private async handleSendTransaction(
    params: EthSendTransactionArguments["params"]
  ): Promise<HexString> {
    const [tx] = params
    // TODO: Check tx from is same as account
    if (!tx.to) {
      // TODO: When `to` is empty, it should create contract
      return
    }
    if (
      tx.from &&
      ethers.getAddress(tx.from) !== (await this.account.getAddress())
    ) {
      throw new Error("Address `from` doesn't match connected account")
    }
    const { bundler, node } = this.networkManager.getActive()
    // TODO: Use account's entry point
    const [entryPointAddress] = await bundler.getSupportedEntryPoints()
    const userOp = await this.account.createUserOperation(node, {
      to: tx.to,
      value: tx.value,
      data: tx.data,
      nonce: tx.nonce
    })
    // TODO: Maybe we don't need to calculate gas and paymaster here
    userOp.setPaymasterAndData(
      await this.paymaster.requestPaymasterAndData(node, userOp)
    )
    if (tx.gas) {
      userOp.setCallGasLimit(tx.gas)
    }
    userOp.setGasFee(await this.estimateGasFee(tx.gasPrice))
    userOp.setGasLimit(
      await bundler.estimateUserOperationGas(userOp, entryPointAddress)
    )
    const userOpHash = await this.userOperationPool.send({
      userOp,
      sender: this.account,
      chainId: await bundler.getChainId(),
      entryPointAddress
    })
    const txHash = await this.userOperationPool.wait(userOpHash)

    return txHash
  }

  private async estimateGasFee(gasPrice?: BigNumberish): Promise<{
    maxFeePerGas: BigNumberish
    maxPriorityFeePerGas: BigNumberish
  }> {
    if (gasPrice) {
      return {
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice
      }
    }
    const { node } = this.networkManager.getActive()
    const fee = await node.getFeeData()
    const gasPriceWithBuffer = (fee.gasPrice * 120n) / 100n
    // TODO: maxFeePerGas and maxPriorityFeePerGas too low error
    return {
      maxFeePerGas: gasPriceWithBuffer,
      maxPriorityFeePerGas: gasPriceWithBuffer
    }
  }
}
