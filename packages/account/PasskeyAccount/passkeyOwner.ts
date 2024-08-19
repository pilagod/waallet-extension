import type { WebAuthnAuthentication } from "~packages/webAuthn"
import type { B64UrlString, BytesLike, Nullable } from "~typing"

export type PasskeyPublicKey = {
  x: bigint
  y: bigint
}

export interface PasskeyOwner {
  getCredentialId(): B64UrlString
  getPublicKey(): Nullable<PasskeyPublicKey>
  // TODO: Remove `metadata`
  sign(challenge: BytesLike, metadata?: any): Promise<WebAuthnAuthentication>
}
