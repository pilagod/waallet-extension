import type {
  WebauthnCreation,
  WebauthnRequest
} from "~packages/webauthn/typing"

export enum ContentMethod {
  content_createWebauthn = "content_createWebauthn",
  content_requestWebauthn = "content_requestWebauthn"
}

export type ContentRequestArguments =
  | ContentCreateWebauthnArguments
  | ContentRequestWebauthnArguments

export type ContentCreateWebauthnArguments = {
  tabId?: number
  name: ContentMethod.content_createWebauthn
  body: WebauthnCreation
}

export type ContentRequestWebauthnArguments = {
  tabId?: number
  name: ContentMethod.content_requestWebauthn
  body: WebauthnRequest
}
