import * as ethers from "ethers"

import abi from "~packages/abi"
import { BundlerProvider } from "~packages/provider/bundler/provider"
import { JsonRpcProvider } from "~packages/provider/rpc/json/provider"
import number from "~packages/utils/number"
import type { BigNumberish, HexString } from "~typings"

import {
  WaalletRpcMethod,
  type EthEstimateGasArguments,
  type EthSendTransactionArguments,
  type WaalletRequestArguments
} from "../rpc"
import { type Account } from "./account"

export class WaalletBackgroundProvider extends JsonRpcProvider {
  public account: Account

  private nodeProvider: ethers.JsonRpcProvider

  public constructor(
    nodeRpcUrl: string,
    private bundlerProvider: BundlerProvider
  ) {
    // TODO: A way to distinguish node rpc url and bundler rpc url
    super(nodeRpcUrl)
    // TODO: Refactor node provider
    this.nodeProvider = new ethers.JsonRpcProvider(nodeRpcUrl)
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
        return this.bundlerProvider.getChainId() as T
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
    const [entryPointAddress] =
      await this.bundlerProvider.getSupportedEntryPoints()
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
    const [entryPointAddress] =
      await this.bundlerProvider.getSupportedEntryPoints()
    const entryPoint = new ethers.Contract(
      entryPointAddress,
      abi.EntryPoint,
      this.nodeProvider
    )
    if (!tx.nonce) {
      tx.nonce = (await entryPoint.getNonce(tx.from, 0)) as bigint
    }
    const userOpGasLimit = await this.estimateUserOperationGas(
      params,
      entryPointAddress
    )
    const userOpGasFee = await this.estimateGasFee(tx.gasPrice)
    const userOp = {
      sender: tx.from,
      nonce: number.toHex(tx.nonce),
      initCode: "0x",
      callData: new ethers.Interface(abi.Account).encodeFunctionData(
        "execute",
        [tx.to, tx.value ? number.toHex(tx.value) : 0, tx.input ?? "0x"]
      ),
      paymasterAndData: "0x",
      signature: "0x",
      ...userOpGasLimit,
      ...userOpGasFee,
      ...(tx.gas && {
        callGasLimit: number.toHex(tx.gas)
      })
    }
    const abiCoder = ethers.AbiCoder.defaultAbiCoder()
    const userOpPacked = abiCoder.encode(
      [
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes32"
      ],
      [
        userOp.sender,
        userOp.nonce,
        ethers.keccak256(userOp.initCode),
        ethers.keccak256(userOp.callData),
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas,
        ethers.keccak256(userOp.paymasterAndData)
      ]
    )
    const userOpHash = ethers.keccak256(
      abiCoder.encode(
        ["bytes32", "address", "uint256"],
        [
          ethers.keccak256(userOpPacked),
          entryPointAddress,
          await this.bundlerProvider.getChainId()
        ]
      )
    )
    userOp.signature = await this.account.signMessage(userOpHash)

    await this.bundlerProvider.sendUserOperation(userOp, entryPointAddress)
    const txHash = await this.bundlerProvider.wait(userOpHash)

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
      this.nodeProvider
    )
    const userOp = {
      sender: tx.from ?? this.account,
      nonce: number.toHex(
        (await entryPoint.getNonce(this.account, 0)) as bigint
      ),
      // TODO: Handle init code when account is not deployed
      initCode: "0x",
      ...(tx.to && {
        callData: new ethers.Interface(abi.Account).encodeFunctionData(
          "execute",
          [tx.to, tx.value ? number.toHex(tx.value) : 0, tx.input ?? "0x"]
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
    return this.bundlerProvider.estimateUserOperationGas(
      userOp,
      entryPointAddress
    )
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
    const fee = await this.nodeProvider.getFeeData()
    // TODO: maxFeePerGas and maxPriorityFeePerGas too low error
    return {
      maxFeePerGas: number.toHex(fee.gasPrice),
      maxPriorityFeePerGas: number.toHex(fee.gasPrice)
    }
  }

  private async createWindow(url: string): Promise<any> {
    // TODO: Require an abstraction for browser to open window
    // await browser.windows.create({
    //   url,
    //   focused: true,
    //   type: "popup",
    //   width: 385,
    //   height: 720
    // })
  }
}
