import * as ethers from "ethers"

import type { HexString } from "~typing"

export enum ValidatorType {
  ECDSAValidator = "ECDSAValidator",
  MultiSigValidator = "MultiSigValidator",
  WebAuthnValidator = "WebAuthnValidator"
}

export interface Validator {
  getAddress(): Promise<HexString>
  isValidSignature(hash: string, signature: string): Promise<boolean>
  getOwnerValidatorInitData(ownerInfo: string): Promise<HexString>
  sign(message: string | Uint8Array, metadata?: any): Promise<HexString>
}

export abstract class ValidatorSkeleton implements Validator {
  protected node: ethers.JsonRpcProvider
  protected validator: ethers.Contract

  protected constructor(opts: {
    address: HexString
    node: ethers.JsonRpcProvider
  }) {
    this.node = opts.node
    this.validator = new ethers.Contract(opts.address, [], this.node)
  }

  /* abstract */
  public abstract sign(
    message: string | Uint8Array,
    metadata?: any
  ): Promise<HexString>
  public abstract isValidSignature(
    hash: string,
    signature: string
  ): Promise<boolean>
  public abstract getOwnerValidatorInitData(
    ownerInfo: string
  ): Promise<HexString>

  /* public */

  public async getAddress(): Promise<HexString> {
    return this.validator.getAddress()
  }
}
