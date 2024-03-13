import type { BytesLike, HexString } from "~typing"

export enum ValidatorType {
  ECDSAValidator = "ECDSAValidator"
}

export interface Validator {
  getAddress(): Promise<HexString>
  getOwnerValidatorInitData(ownerInfo?: string): Promise<HexString>
  getDummySignature(): Promise<HexString>
  sign(message: BytesLike, metadata?: any): Promise<HexString>
}
