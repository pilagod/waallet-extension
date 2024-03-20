import * as ethers from "ethers"

import type { BytesLike, HexString } from "~typing"

export interface Validator {
  getAddress(): Promise<HexString>
  getOwnerValidatorInitData(ownerInfo?: string): Promise<HexString>
  getDummySignature(): Promise<HexString>
  sign(message: BytesLike, metadata?: any): Promise<HexString>
}

export function getValidatorSignMessage(
  message: BytesLike,
  validatorAddress: string
): string {
  const digest = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "address"],
      [message, validatorAddress]
    )
  )

  return ethers.keccak256(
    ethers.solidityPacked(
      ["string", "string", "bytes"],
      [
        "\x19Ethereum Signed Message:\n",
        ethers.dataLength(digest).toString(), // digest length must be 32
        digest
      ]
    )
  )
}

export interface WebAuthnValidatorOwner {
  use(credentialId: string): void
  sign(
    challenge: BytesLike,
    metadata?: any
  ): Promise<{
    rawSignature: HexString
    clientData: string
    authenticatorData: string
  }>
}
