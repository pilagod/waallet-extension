export interface PasskeyOwner {
  set(credentialId: string): void
  signMessage(message: string | Uint8Array): Promise<string>
}
