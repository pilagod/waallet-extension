import type { B64UrlString, BytesLike, HexString } from "~typing"

export interface PasskeyOwner {
  getCredentialId(): B64UrlString
  sign(challenge: BytesLike, metadata?: any): Promise<HexString>
}
