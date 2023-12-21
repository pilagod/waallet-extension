export interface PasskeyOwner {
  signMessage(message: string | Uint8Array): Promise<string>
}
