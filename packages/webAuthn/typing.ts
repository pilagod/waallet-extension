import { type ParsedAuthenticatorData } from "@simplewebauthn/server/helpers"

import type { BigNumberish, HexString, UrlB64String } from "~typing"

/* Input */
export type WebAuthnCreation = {
  user?: string
  challenge?: UrlB64String
}
export type WebAuthnRequest = {
  credentialId?: UrlB64String
  challenge: UrlB64String
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
  credentialId: UrlB64String
  publicKey: PublicKey
  authData: ParsedAuthenticatorData
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
