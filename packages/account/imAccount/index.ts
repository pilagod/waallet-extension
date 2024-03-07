import * as ethers from "ethers"

import type { Call } from "~packages/account"
import imAccountMetadata from "~packages/account/imAccount/abis/imAccount.json"
import type { Validator } from "~packages/account/imAccount/validator"
import { ValidatorType } from "~packages/account/imAccount/validator"
import { ECDSAValidator } from "~packages/account/imAccount/validators/ecdsaValidator"
import { AccountSkeleton } from "~packages/account/skeleton"
import type { BigNumberish, HexString } from "~typing"

import { imAccountFactory } from "./factory"

export class imAccount extends AccountSkeleton<imAccountFactory> {
  /**
   * Use when account is already deployed
   */
  public static async init(opts: {
    address: string
    ownerKeyInfo: string
    nodeRpcUrl: string
    defaultValidatorType: ValidatorType
    defaultValidatorAddress: string
    entryPointAddress: string
  }) {
    return new imAccount({
      address: opts.address,
      ownerKeyInfo: opts.ownerKeyInfo,
      nodeRpcUrl: opts.nodeRpcUrl,
      validatorType: opts.defaultValidatorType,
      validatorAddress: opts.defaultValidatorAddress,
      entryPointAddress: opts.entryPointAddress
    })
  }

  /**
   * Use when account is not yet deployed
   */

  public static async initWithFactory(opts: {
    ownerInfo: string
    ownerKeyInfo: string
    factoryAddress: string
    implementationAddress: string
    entryPointAddress: string
    defaultValidatorType: ValidatorType
    defaultValidatorAddress: string
    fallbackHandlerAddress: string
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    const factory = new imAccountFactory({
      ownerInfo: opts.ownerInfo,
      ownerKeyInfo: opts.ownerKeyInfo,
      factoryAddress: opts.factoryAddress,
      implementationAddress: opts.implementationAddress,
      entryPointAddress: opts.entryPointAddress,
      validatorType: opts.defaultValidatorType,
      validatorAddress: opts.defaultValidatorAddress,
      fallbackHandlerAddress: opts.fallbackHandlerAddress,
      salt: opts.salt,
      nodeRpcUrl: opts.nodeRpcUrl
    })
    return new imAccount({
      address: await factory.getAddress(),
      ownerKeyInfo: opts.ownerKeyInfo,
      factory,
      nodeRpcUrl: opts.nodeRpcUrl,
      validatorType: opts.defaultValidatorType,
      validatorAddress: opts.defaultValidatorAddress,
      entryPointAddress: opts.entryPointAddress
    })
  }

  private account: ethers.Contract
  private validator: Validator
  private entryPointAddress: string

  private constructor(opts: {
    address: HexString
    ownerKeyInfo: string
    factory?: imAccountFactory
    nodeRpcUrl: string
    validatorType: ValidatorType
    validatorAddress: string
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
    this.setValidator(
      opts.validatorType,
      opts.validatorAddress,
      opts.ownerKeyInfo
    )
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
    return await this.validator.sign(
      "0xdd891769d0de4984ec26e2a3646e563772b423104875118a0cec54688ae0f150"
    )
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

  protected async setValidator(
    validatorType: ValidatorType,
    validatorAddress: string,
    ownerKeyInfo: string
  ) {
    if (validatorType == ValidatorType.ECDSAValidator) {
      this.validator = new ECDSAValidator({
        address: validatorAddress,
        ownerPrivateKey: ownerKeyInfo,
        node: this.node
      })
    } else if (validatorType == ValidatorType.MultiSigValidator) {
    } else if (validatorType == ValidatorType.WebAuthnValidator) {
    } else {
      throw Error()
    }
  }
}
