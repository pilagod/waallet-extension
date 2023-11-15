import * as ethers from "ethers"

import number from "~packages/utils/number"
import type { HexString } from "~typings"

import accountAbi from "./abi/account"
import entryPointAbi from "./abi/entryPoint"
import {
  Method,
  request,
  type EthEstimateGasArguments,
  type RequestArguments
} from "./rpc"

export class WaalletProvider {
  public account = "0x661b4a3909b486a3da520403ecc78f7a7b683c63"

  private nodeRpcProvider: ethers.JsonRpcProvider

  public constructor(
    private nodeRpcUrl: string,
    private bundlerRpcUrl: string
  ) {
    this.nodeRpcProvider = new ethers.JsonRpcProvider(nodeRpcUrl)
  }

  // TODO: Refine response type
  public async request(args: RequestArguments): Promise<any> {
    console.log(args)
    switch (args.method) {
      case Method.eth_accounts:
        return Promise.resolve([this.account])
      case Method.eth_chainId:
        return request(this.bundlerRpcUrl, args)
      case Method.eth_estimateGas:
        return this.handleEstimateUserOperationGas(args)
      default:
        return request(this.nodeRpcUrl, args)
    }
  }

  private async handleEstimateUserOperationGas(args: EthEstimateGasArguments) {
    // TODO: Check if the one on account matches that one on bundler
    const [entryPointAddress] = await request<string[]>(this.bundlerRpcUrl, {
      method: Method.eth_supportedEntryPoints
    })
    const entryPoint = new ethers.Contract(
      entryPointAddress,
      entryPointAbi,
      this.nodeRpcProvider
    )
    const [tx] = args.params
    const userOp = {
      sender: this.account,
      nonce: number.toHex(
        (await entryPoint.getNonce(this.account, 0)) as bigint
      ),
      // TODO: Handle init code when account is not deployed
      initCode: "0x",
      callData: new ethers.Interface(accountAbi).encodeFunctionData("execute", [
        tx.to,
        tx.value ? number.toHex(tx.value) : 0,
        tx.input ?? "0x"
      ]),
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
    const e = await request<{
      preVerificationGas: HexString
      verificationGasLimit: HexString
      callGasLimit: HexString
    }>(this.bundlerRpcUrl, {
      method: Method.eth_estimateUserOperationGas,
      params: [userOp, entryPointAddress]
    })
    return number.toHex(
      ethers.toBigInt(e.verificationGasLimit) +
        ethers.toBigInt(e.callGasLimit) +
        ethers.toBigInt(e.preVerificationGas)
    )
  }
}
