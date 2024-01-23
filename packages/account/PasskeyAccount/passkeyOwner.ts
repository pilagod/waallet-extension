import type { BytesLike, HexString } from "~typing"

export interface PasskeyOwner {
  use(credentialId: string): void
  sign(challenge: BytesLike, metadata?: any): Promise<HexString>
}
