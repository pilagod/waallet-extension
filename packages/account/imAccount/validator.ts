import { ECDSAValidator } from "~packages/account/imAccount/validators/ecdsaValidator"
import type { HexString } from "~typing"

export enum ValidatorType {
  ECDSAValidator = "ECDSAValidator"
}

export interface Validator {
  getAddress(): Promise<HexString>
  isValidSignature(hash: string, signature: string): Promise<boolean>
  getOwnerValidatorInitData(ownerInfo?: string): Promise<HexString>
  sign(message: string | Uint8Array, metadata?: any): Promise<HexString>
}

export function createValidator(
  validatorType: ValidatorType,
  validatorAddress: string,
  ownerKeyInfo: string,
  nodeRpcUrl: string
) {
  if (validatorType == ValidatorType.ECDSAValidator) {
    return new ECDSAValidator({
      address: validatorAddress,
      ownerPrivateKey: ownerKeyInfo,
      nodeRpcUrl: nodeRpcUrl
    })
  } else {
    throw Error()
  }
}
