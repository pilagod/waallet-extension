import type { BigNumberish, HexString, UriString, UrlB64String } from "~typing"

/* Input */
export type WebAuthnCreation = {
  user?: UriString
  challenge?: UrlB64String
}
export type WebAuthnRequest = {
  credentialId?: UrlB64String
  challenge: UrlB64String
}

/* Output */
export type PublicKey = {
  x: BigNumberish
  y: BigNumberish
}
export type WebAuthnRegistration = {
  origin: string
  credentialId: UrlB64String
  publicKey: PublicKey
}
export type Signature = {
  r: BigNumberish
  s: BigNumberish
}
export type WebAuthnAuthentication = {
  authenticatorData: HexString
  clientDataJson: string
  signature: Signature
}

/* Error handling */
export type WebAuthnError = {
  error: string
}
export const isWebAuthnError = (message: any): message is WebAuthnError => {
  return "error" in message
}
