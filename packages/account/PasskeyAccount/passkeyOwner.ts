import type { B64UrlString, BytesLike, HexString, Nullable } from "~typing"

export type PasskeyPublicKey = {
  x: bigint
  y: bigint
}

export interface PasskeyOwner {
  getCredentialId(): B64UrlString
  getPublicKey(): Nullable<PasskeyPublicKey>
  sign(challenge: BytesLike, metadata?: any): Promise<HexString>
}
