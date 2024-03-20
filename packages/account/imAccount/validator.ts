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
    signature: HexString
    clientData: ClientData
    authenticatorData: AuthenticatorData
  }>
}

export type ClientData = {
  type: string
  challenge: string
  origin: string
  crossOrigin: boolean
}

export type AuthenticatorData = {
  rpIdHash: string
  flags: {
    up: boolean // User Presence
    uv: boolean // User Verified
    be: boolean // Backup Eligibility
    bs: boolean // Backup State
    at: boolean // Attested Credential Data Present
    ed: boolean // Extension Data Present
    flagsInt: number
  }
  counter: number
}
