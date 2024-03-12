import * as ethers from "ethers"

import type { Call } from "~packages/account"
import imAccountMetadata from "~packages/account/imAccount/abis/imAccount.json"
import type { Validator } from "~packages/account/imAccount/validator"
import { AccountSkeleton } from "~packages/account/skeleton"
import type { BigNumberish, HexString } from "~typing"

import { imAccountFactory } from "./factory"

export class imAccount extends AccountSkeleton<imAccountFactory> {
  /**
   * Use when account is already deployed
   */
  public static async init(opts: {
    address: string
    nodeRpcUrl: string
    validator: Validator
    entryPointAddress: string
  }) {
    return new imAccount({
      address: opts.address,
      nodeRpcUrl: opts.nodeRpcUrl,
      validator: opts.validator,
      entryPointAddress: opts.entryPointAddress
    })
  }

  /**
   * Use when account is not yet deployed
   */

  public static async initWithFactory(opts: {
    factoryAddress: string
    implementationAddress: string
    entryPointAddress: string
    validator: Validator
    fallbackHandlerAddress: string
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    const factory = new imAccountFactory({
      factoryAddress: opts.factoryAddress,
      implementationAddress: opts.implementationAddress,
      entryPointAddress: opts.entryPointAddress,
      validator: opts.validator,
      fallbackHandlerAddress: opts.fallbackHandlerAddress,
      salt: opts.salt,
      nodeRpcUrl: opts.nodeRpcUrl
    })
    return new imAccount({
      address: await factory.getAddress(),
      factory,
      nodeRpcUrl: opts.nodeRpcUrl,
      validator: opts.validator,
      entryPointAddress: opts.entryPointAddress
    })
  }

  private account: ethers.Contract
  private validator: Validator
  private entryPointAddress: string

  private constructor(opts: {
    address: HexString
    factory?: imAccountFactory
    nodeRpcUrl: string
    validator: Validator
    entryPointAddress: string
  }) {
    super({
      address: opts.address,
      factory: opts.factory,
      nodeRpcUrl: opts.nodeRpcUrl
    })
    this.account = new ethers.Contract(
      opts.address,
      imAccountMetadata.abi,
      this.node
    )
    this.validator = opts.validator
    this.entryPointAddress = opts.entryPointAddress
  }

  public async sign(message: string | Uint8Array, metadata?: any) {
    return await this.validator.sign(message, metadata)
  }

  protected async getCallData(call: Call): Promise<HexString> {
    const calls: Call[] = [
      {
        to: call.to,
        value: call.value ?? 0,
        data: call.data ?? "0x"
      }
    ]
    return this.account.interface.encodeFunctionData("execute", [calls])
  }
  protected async getDummySignature(): Promise<HexString> {
    return await this.validator.sign("DummyMessage")
  }

  protected async getNonce(): Promise<BigNumberish> {
    const entryPoint = new ethers.Contract(
      this.entryPointAddress,
      ["function getNonce(address,uint192)public view  returns (uint256 )"],
      this.node
    )
    const nonce = (await entryPoint.getNonce(
      await this.account.getAddress(),
      0
    )) as bigint
    return nonce
  }
}
