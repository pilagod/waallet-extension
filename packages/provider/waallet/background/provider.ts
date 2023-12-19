import * as ethers from "ethers"

import abi from "~packages/abi"
import { type Account } from "~packages/account"
import { BundlerProvider } from "~packages/provider/bundler/provider"
import { getUserOpHash } from "~packages/provider/bundler/util"
import { JsonRpcProvider } from "~packages/provider/rpc/json/provider"
import number from "~packages/utils/number"
import type { BigNumberish, HexString } from "~typings"

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
    // TODO: Use account's entry point
    const [entryPointAddress] = await this.bundler.getSupportedEntryPoints()
    const { callGasLimit } = await this.estimateUserOperationGas(
      params,
      entryPointAddress
    )
    return number.toHex(callGasLimit)
  }

  private async handleSendTransaction(
    params: EthSendTransactionArguments["params"]
  ): Promise<HexString> {
    const [tx] = params
    // TODO: Check tx from is same as account
    const [entryPointAddress] = await this.bundler.getSupportedEntryPoints()
    const entryPoint = new ethers.Contract(
      entryPointAddress,
      abi.EntryPoint,
      this.node
    )
    if (!tx.nonce) {
      tx.nonce = (await entryPoint.getNonce(tx.from, 0)) as bigint
    }
    const userOpGasLimit = await this.estimateUserOperationGas(
      params,
      entryPointAddress
    )
    const userOpGasFee = await this.estimateGasFee(tx.gasPrice)
    // TODO: Fix sender to connected account
    const userOp = {
      sender: tx.from,
      nonce: number.toHex(tx.nonce),
      initCode: await this.account.getInitCode(),
      callData: new ethers.Interface(abi.Account).encodeFunctionData(
        "execute",
        [tx.to, tx.value ? number.toHex(tx.value) : 0, tx.data ?? "0x"]
      ),
      paymasterAndData: "0x",
      signature: "0x",
      ...userOpGasLimit,
      ...userOpGasFee,
      ...(tx.gas && {
        callGasLimit: number.toHex(tx.gas)
      })
    }
    const userOpHash = await getUserOpHash(
      userOp,
      entryPointAddress,
      await this.bundler.getChainId()
    )
    userOp.signature = await this.account.signMessage(userOpHash)

    await this.bundler.sendUserOperation(userOp, entryPointAddress)
    const txHash = await this.bundler.wait(userOpHash)

    return txHash
  }

  private async estimateUserOperationGas(
    params: EthEstimateGasArguments["params"],
    entryPointAddress: HexString
  ): Promise<{
    preVerificationGas: HexString
    verificationGasLimit: HexString
    callGasLimit: HexString
  }> {
    const [tx] = params
    const entryPoint = new ethers.Contract(
      entryPointAddress,
      abi.EntryPoint,
      this.node
    )
    // TODO: Fix sender to connected account
    const userOp = {
      sender: tx.from ?? (await this.account.getAddress()),
      nonce: number.toHex(
        (await entryPoint.getNonce(
          await this.account.getAddress(),
          0
        )) as bigint
      ),
      initCode: await this.account.getInitCode(),
      ...(tx.to && {
        callData: new ethers.Interface(abi.Account).encodeFunctionData(
          "execute",
          [tx.to, tx.value ? number.toHex(tx.value) : 0, tx.data ?? "0x"]
        )
      }),
      paymasterAndData: "0x",
      // Dummy signature for simple account
      signature:
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
      ...(tx.gas && {
        callGasLimit: number.toHex(tx.gas)
      }),
      ...(tx.gasPrice && {
        maxFeePerGas: number.toHex(tx.gasPrice),
        maxPriorityFeePerGas: number.toHex(tx.gasPrice)
      })
    }
    return this.bundler.estimateUserOperationGas(userOp, entryPointAddress)
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
