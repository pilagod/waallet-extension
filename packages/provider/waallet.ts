import * as ethers from "ethers"
import type { BigNumberish } from "ethers"

import {
  sendToBackgroundViaRelay,
  type MessagesMetadata
} from "@plasmohq/messaging"

import number from "~packages/utils/number"
import type { HexString } from "~typings"

import accountAbi from "./abi/account"
import entryPointAbi from "./abi/entryPoint"
import { BundlerProvider } from "./bundler"
import {
  Method,
  request,
  type EthEstimateGasArguments,
  type EthSendTransactionArguments,
  type RequestArguments
} from "./rpc"

export class WaalletProvider {
  // TODO: Setup an account instance
  public account = "0x661b4a3909b486a3da520403ecc78f7a7b683c63"
  private accountOwnerPrivateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

  private nodeRpcProvider: ethers.JsonRpcProvider

  public constructor(
    private nodeRpcUrl: string,
    private bundlerProvider: BundlerProvider
  ) {
    this.nodeRpcProvider = new ethers.JsonRpcProvider(nodeRpcUrl)
  }

  // TODO: Refine response type
  public async request<T>(args: RequestArguments): Promise<T> {
    console.log(args)
    switch (args.method) {
      case Method.eth_accounts:
        return Promise.resolve([this.account]) as T
      case Method.eth_chainId:
        return request(this.bundlerProvider.rpcUrl, args)
      case Method.eth_estimateGas:
        return this.handleEstimateUserOperationGas(args.params) as T
      case Method.eth_sendTransaction:
        return this.handleSendTransaction(args.params) as T
      default:
        return request(this.nodeRpcUrl, args)
    }
  }

  private async handleEstimateUserOperationGas(
    params: EthEstimateGasArguments["params"]
  ): Promise<HexString> {
    // TODO: Use account's entry point
    const [entryPointAddress] = await request<string[]>(
      this.bundlerProvider.rpcUrl,
      {
        method: Method.eth_supportedEntryPoints
      }
    )
    const e = await this.estimateUserOperationGas(params, entryPointAddress)

    // TODO: Return only call gas limit
    return number.toHex(
      ethers.toBigInt(e.verificationGasLimit) +
        ethers.toBigInt(e.callGasLimit) +
        ethers.toBigInt(e.preVerificationGas)
    )
  }

  private async handleSendTransaction(
    params: EthSendTransactionArguments["params"]
  ): Promise<HexString> {
    const [tx] = params
    // TODO: Check tx from is same as account
    const [entryPointAddress] = await request<string[]>(
      this.bundlerProvider.rpcUrl,
      {
        method: Method.eth_supportedEntryPoints
      }
    )
    const entryPoint = new ethers.Contract(
      entryPointAddress,
      entryPointAbi,
      this.nodeRpcProvider
    )
    if (!tx.nonce) {
      tx.nonce = (await entryPoint.getNonce(tx.from, 0)) as bigint
    }
    const userOpGasEst = await this.estimateUserOperationGas(
      params,
      entryPointAddress
    )
    const userOpGasFee = await this.estimateGasFee(tx.gasPrice)
    const userOp = {
      sender: tx.from,
      nonce: number.toHex(tx.nonce),
      initCode: "0x",
      callData: new ethers.Interface(accountAbi).encodeFunctionData("execute", [
        tx.to,
        tx.value ? number.toHex(tx.value) : 0,
        tx.input ?? "0x"
      ]),
      paymasterAndData: "0x",
      signature: "0x",
      ...userOpGasEst,
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
          await this.request<HexString>({ method: Method.eth_chainId })
        ]
      )
    )
    userOp.signature = await new ethers.Wallet(
      this.accountOwnerPrivateKey
    ).signMessage(ethers.getBytes(userOpHash))

    await request(this.bundlerProvider.rpcUrl, {
      method: Method.eth_sendUserOperation,
      params: [userOp, entryPointAddress]
    })
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
      entryPointAbi,
      this.nodeRpcProvider
    )
    const userOp = {
      sender: tx.from ?? this.account,
      nonce: number.toHex(
        (await entryPoint.getNonce(this.account, 0)) as bigint
      ),
      // TODO: Handle init code when account is not deployed
      initCode: "0x",
      ...(tx.to && {
        callData: new ethers.Interface(accountAbi).encodeFunctionData(
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
    return request(this.bundlerProvider.rpcUrl, {
      method: Method.eth_estimateUserOperationGas,
      params: [userOp, entryPointAddress]
    })
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
    const fee = await this.nodeRpcProvider.getFeeData()
    // TODO: maxFeePerGas and maxPriorityFeePerGas too low error
    return {
      maxFeePerGas: number.toHex(fee.gasPrice),
      maxPriorityFeePerGas: number.toHex(fee.gasPrice)
    }
  }

  /**
   * Usage:
   *   await this.createWindow({
   *     sourceMethod: "eth_someCreationWindowMethod",
   *     post: "createWindow",
   *     params: { hello: "world" },
   *   });
   */
  private async createWindow(args: {
    sourceMethod: string
    post: string
    params: any
  }): Promise<any> {
    console.log(
      `[provider][createWindow] arguments: ${JSON.stringify(args, null, 2)}`
    )
    if (args.sourceMethod !== "eth_someCreationWindowMethod") {
      throw new Error("Invalid method")
    }
    if (args.post !== "createWindow") {
      throw new Error("Invalid post")
    }

    // Send to the service worker's messaging via content script's relay (contents/relayer.ts).
    const res = await sendToBackgroundViaRelay({
      name: "mCreateWindow" as keyof MessagesMetadata, // Defined by the background/messages/mCreateWindow.ts filename
      body: { in: `Please create the window.` }
    })
    console.log(
      `[provider][createWindow] response: ${JSON.stringify(res, null, 2)}`
    )
    return res
  }
}
