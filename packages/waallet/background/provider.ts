import * as ethers from "ethers"

import type { AccountManager } from "~packages/account/manager"
import { UserOperation } from "~packages/bundler"
import type { NetworkManager } from "~packages/network/manager"
import { type Paymaster } from "~packages/paymaster"
import { JsonRpcProvider } from "~packages/rpc/json/provider"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

import {
  WaalletRpcMethod,
  type EthEstimateGasArguments,
  type EthEstimateUserOperationGasArguments,
  type EthGetStatusByTransactionHashArguments,
  type EthSendTransactionArguments,
  type WaalletRequestArguments
} from "../rpc"
import { type UserOperationPool } from "./pool/userOperation"

export type WaalletBackgroundProviderOption = {
  accountManager?: AccountManager
  networkManager?: NetworkManager
  paymaster?: Paymaster
  userOperationPool?: UserOperationPool
}

export class WaalletBackgroundProvider {
  public constructor(
    public accountManager: AccountManager,
    public networkManager: NetworkManager,
    public paymaster: Paymaster,
    public userOperationPool: UserOperationPool
  ) {}

  public clone(option: WaalletBackgroundProviderOption = {}) {
    const provider = new WaalletBackgroundProvider(
      option.accountManager ?? this.accountManager,
      option.networkManager ?? this.networkManager,
      option.paymaster ?? this.paymaster,
      option.userOperationPool ?? this.userOperationPool
    )
    return provider
  }

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    console.log(args)
    const { bundler, node } = this.networkManager.getActive()
    switch (args.method) {
      case WaalletRpcMethod.eth_accounts:
      case WaalletRpcMethod.eth_requestAccounts:
        const { account } = await this.accountManager.getActive()
        return [await account.getAddress()] as T
      case WaalletRpcMethod.eth_chainId:
        return number.toHex(await bundler.getChainId()) as T
      case WaalletRpcMethod.eth_estimateGas:
        return this.handleEstimateGas(args.params) as T
      case WaalletRpcMethod.eth_estimateUserOperationGas:
        return this.handleEstimateUserOperationGas(args.params) as T
      case WaalletRpcMethod.eth_sendTransaction:
        return this.handleSendTransaction(args.params) as T
      case WaalletRpcMethod.eth_sendUserOperation:
        return bundler.sendUserOperation(
          new UserOperation(args.params[0]),
          args.params[1]
        ) as T
      case WaalletRpcMethod.eth_getStatusByTransactionHash:
        return this.handleGetStatusByTransactionHash(args.params) as T
      case WaalletRpcMethod.eth_getTransactionHashByUserOperationHash:
        return bundler.wait(args.params[0]) as T
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
    const { account } = await this.accountManager.getActive()
    if (
      tx.from &&
      ethers.getAddress(tx.from) !== (await account.getAddress())
    ) {
      throw new Error("Address `from` doesn't match connected account")
    }
    const { bundler, node } = this.networkManager.getActive()
    // TODO: Use account's entry point
    const [entryPointAddress] = await bundler.getSupportedEntryPoints()
    const userOp = await account.createUserOperation(node, {
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
    const userOp = new UserOperation(params[0])
    const { bundler } = this.networkManager.getActive()
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
    const { id: accountId, account } = await this.accountManager.getActive()
    if (
      tx.from &&
      ethers.getAddress(tx.from) !== (await account.getAddress())
    ) {
      throw new Error("Address `from` doesn't match connected account")
    }
    const { id: networkId, bundler, node } = this.networkManager.getActive()
    // TODO: Use account's entry point
    const [entryPointAddress] = await bundler.getSupportedEntryPoints()
    const userOp = await account.createUserOperation(node, {
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
    const userOpId = await this.userOperationPool.send({
      userOp,
      senderId: accountId,
      networkId,
      entryPointAddress
    })
    const { transactionHash } = await this.userOperationPool.wait(userOpId)

    return transactionHash
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

  private async handleGetStatusByTransactionHash(
    params: EthGetStatusByTransactionHashArguments["params"]
  ): Promise<number> {
    const { node } = this.networkManager.getActive()
    const txReceipt = await node.getTransactionReceipt(params[0])
    // '1' indicates a success, '0' indicates a revert, '-1' indicates a null.
    return txReceipt ? txReceipt.status : -1
  }
}
