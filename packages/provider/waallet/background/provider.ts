import * as ethers from "ethers"

import { type Account } from "~packages/account"
import { BundlerProvider } from "~packages/provider/bundler/provider"
import { getUserOpHash } from "~packages/provider/bundler/util"
import { JsonRpcProvider } from "~packages/provider/jsonrpc/provider"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

import {
  WaalletRpcMethod,
  type EthEstimateGasArguments,
  type EthSendTransactionArguments,
  type WaalletRequestArguments
} from "../rpc"

export class WaalletBackgroundProvider extends JsonRpcProvider {
  public account: Account

  private node: ethers.JsonRpcProvider

  public constructor(
    nodeRpcUrl: string,
    private bundler: BundlerProvider
  ) {
    // TODO: A way to distinguish node rpc url and bundler rpc url
    super(nodeRpcUrl)
    // TODO: Refactor node provider
    this.node = new ethers.JsonRpcProvider(nodeRpcUrl)
  }

  public connect(account: Account) {
    this.account = account
  }

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    console.log(args)
    switch (args.method) {
      case WaalletRpcMethod.eth_accounts:
      case WaalletRpcMethod.eth_requestAccounts:
        return [await this.account.getAddress()] as T
      case WaalletRpcMethod.eth_chainId:
        return this.bundler.getChainId() as T
      case WaalletRpcMethod.eth_estimateGas:
        return this.handleEstimateUserOperationGas(args.params) as T
      case WaalletRpcMethod.eth_sendTransaction:
        return this.handleSendTransaction(args.params) as T
      default:
        return this.send(args)
    }
  }

  private async handleEstimateUserOperationGas(
    params: EthEstimateGasArguments["params"]
  ): Promise<HexString> {
    const [tx] = params
    // TODO: When `to` is empty, it should estimate gas for contract creation
    // TODO: Use account's entry point
    const [entryPointAddress] = await this.bundler.getSupportedEntryPoints()
    // TODO: Integrate paymaster
    const paymasterAndData = "0x"
    const userOpCall = await this.account.createUserOperationCall({
      to: tx.to,
      value: tx.value,
      data: tx.data
    })
    const { callGasLimit } = await this.bundler.estimateUserOperationGas(
      {
        ...userOpCall,
        ...(tx.gas && {
          callGasLimit: number.toHex(tx.gas)
        }),
        paymasterAndData
      },
      entryPointAddress
    )
    return number.toHex(callGasLimit)
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
    // TODO: Use account's entry point
    const [entryPointAddress] = await this.bundler.getSupportedEntryPoints()
    // TODO: Integrate paymaster
    const paymasterAndData = "0x"
    const userOpCall = await this.account.createUserOperationCall({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      nonce: tx.nonce
    })
    const userOpGasFee = await this.estimateGasFee(tx.gasPrice)
    const userOpGasLimit = await this.bundler.estimateUserOperationGas(
      {
        ...userOpCall,
        ...(tx.gas && {
          callGasLimit: number.toHex(tx.gas)
        }),
        paymasterAndData
      },
      entryPointAddress
    )
    const userOp = {
      ...userOpCall,
      ...userOpGasLimit,
      ...userOpGasFee,
      paymasterAndData
    }
    const userOpHash = await getUserOpHash(
      userOp,
      entryPointAddress,
      await this.bundler.getChainId()
    )
    userOp.signature = await this.account.signMessage(userOpHash)

    const success = await this.bundler.sendUserOperation(
      userOp,
      entryPointAddress
    )
    if (!success) {
      throw new Error("Send user operation fail")
    }
    const txHash = await this.bundler.wait(userOpHash)

    return txHash
  }

  private async estimateGasFee(gasPrice?: BigNumberish): Promise<{
    maxFeePerGas: HexString
    maxPriorityFeePerGas: HexString
  }> {
    if (gasPrice) {
      return {
        maxFeePerGas: number.toHex(gasPrice),
        maxPriorityFeePerGas: number.toHex(gasPrice)
      }
    }
    const fee = await this.node.getFeeData()
    const gasPriceWithBuffer = (fee.gasPrice * 120n) / 100n
    // TODO: maxFeePerGas and maxPriorityFeePerGas too low error
    return {
      maxFeePerGas: number.toHex(gasPriceWithBuffer),
      maxPriorityFeePerGas: number.toHex(gasPriceWithBuffer)
    }
  }
}
