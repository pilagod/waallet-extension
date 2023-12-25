export interface PasskeyOwner {
  set(credentialId: string): void
  sign(challenge: string | Uint8Array): Promise<string>
}
