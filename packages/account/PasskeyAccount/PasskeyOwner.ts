import type { BytesLike } from "~typing"

export interface PasskeyOwner {
  set(credentialId: string): void
  sign(challenge: BytesLike): Promise<string>
}
