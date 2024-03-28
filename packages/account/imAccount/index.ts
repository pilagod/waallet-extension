import * as ethers from "ethers"

import type { Call } from "~packages/account"
import imAccountMetadata from "~packages/account/imAccount/abi/imAccount.json"
import type { Validator } from "~packages/account/imAccount/validator"
import { AccountSkeleton } from "~packages/account/skeleton"
import { type ContractRunner } from "~packages/node"
import type { BigNumberish, BytesLike, HexString } from "~typing"

import { imAccountFactory } from "./factory"

export class imAccount extends AccountSkeleton<imAccountFactory> {
  /**
   * Use when account is already deployed
   */
  public static async init(opts: { address: string; validator: Validator }) {
    return new imAccount({
      address: opts.address,
      validator: opts.validator
    })
  }

  /**
   * Use when account is not yet deployed
   */

  public static async initWithFactory(
    runner: ContractRunner,
    opts: {
      factoryAddress: string
      implementationAddress: string
      entryPointAddress: string
      validator: Validator
      fallbackHandlerAddress: string
      salt: BigNumberish
    }
  ) {
    const factory = new imAccountFactory({
      factoryAddress: opts.factoryAddress,
      implementationAddress: opts.implementationAddress,
      entryPointAddress: opts.entryPointAddress,
      validator: opts.validator,
      fallbackHandlerAddress: opts.fallbackHandlerAddress,
      salt: opts.salt
    })
    return new imAccount({
      address: await factory.getAddress(runner),
      factory,
      validator: opts.validator
    })
  }

  public validator: Validator
  private account: ethers.Contract

  private constructor(opts: {
    address: HexString
    factory?: imAccountFactory
    validator: Validator
  }) {
    super({
      address: opts.address,
      factory: opts.factory
    })
    this.account = new ethers.Contract(opts.address, imAccountMetadata.abi)
    this.validator = opts.validator
  }

  public changeValidator(newValidator: Validator) {
    this.validator = newValidator
  }

  public async sign(message: BytesLike, metadata?: any) {
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
    return await this.validator.getDummySignature()
  }
}
