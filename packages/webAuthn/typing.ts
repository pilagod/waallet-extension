import type { B64UrlString, BigNumberish, HexString } from "~typing"

/* Input */
export type WebAuthnCreation = {
  user?: string
  challenge?: B64UrlString
}
export type WebAuthnRequest = {
  credentialId?: B64UrlString
  challenge: B64UrlString
}
export type WebAuthnParams = {
  // Resolve error: A required parameter cannot follow an optional parameter.
  webAuthnCreation?: WebAuthnCreation
  webAuthnRequest: WebAuthnRequest
}

/* Output */
export type PublicKey = {
  x: BigNumberish
  y: BigNumberish
}
export type WebAuthnRegistration = {
  origin: string
  credentialId: B64UrlString
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
