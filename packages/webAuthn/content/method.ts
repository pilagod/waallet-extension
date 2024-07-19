import type { WebAuthnCreation, WebAuthnRequest } from "~packages/webAuthn"

export enum ContentMethod {
  content_createWebAuthn = "content_createWebAuthn",
  content_requestWebAuthn = "content_requestWebAuthn"
}

export type ContentRequestArguments =
  | ContentCreateWebAuthnArguments
  | ContentRequestWebAuthnArguments

export type ContentCreateWebAuthnArguments = {
  tabId?: number
  name: ContentMethod.content_createWebAuthn
  body: WebAuthnCreation
}

export type ContentRequestWebAuthnArguments = {
  tabId?: number
  name: ContentMethod.content_requestWebAuthn
  body: WebAuthnRequest
}
