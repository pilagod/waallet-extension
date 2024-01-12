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
export type WebAuthnRegistration = {
  origin: string
  credentialId: UrlB64String
  publicKeyX: BigNumberish
  publicKeyY: BigNumberish
}
export type WebAuthnAuthentication = {
  authenticatorData: HexString
  clientDataJson: string
  sigantureR: BigNumberish
  signatureS: BigNumberish
}

/* Error */
export type WebAuthnError = {
  error: string
}

export const isWebAuthnError = (message: any): message is WebAuthnError => {
  return "error" in message
}
