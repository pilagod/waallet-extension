import type { BigNumberish, HexString, UriString, UrlB64String } from "~typing"

/* Input */
export type WebauthnCreation = {
  user?: UriString
  challenge?: UrlB64String
}
export type WebauthnRequest = {
  credentialId?: UrlB64String
  challenge: UrlB64String
}
/* Output */
export type WebauthnRegistration = {
  origin: string
  credentialId: UrlB64String
  publicKeyX: BigNumberish
  publicKeyY: BigNumberish
}
export type WebauthnAuthentication = {
  authenticatorData: HexString
  clientDataJson: string
  sigantureR: BigNumberish
  signatureS: BigNumberish
}

/* Error */
export type WebauthnError = {
  error: string
}

export const isWebauthnError = (message: any): message is WebauthnError => {
  return "error" in message
}
