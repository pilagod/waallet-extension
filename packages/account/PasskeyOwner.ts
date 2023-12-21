export interface PasskeyOwner {
  set(credentialId: string): void
  signChallenge(challenge: string | Uint8Array): Promise<string>
}
