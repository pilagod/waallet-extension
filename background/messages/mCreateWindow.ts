import { runtime } from "webextension-polyfill"

import { type PlasmoMessaging } from "@plasmohq/messaging"

import {
  webAuthnTabAsync,
  webAuthnWindowAsync
} from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/background/webauthn"
import type {
  WebAuthnCreation,
  WebAuthnRequest
} from "~packages/webauthn/typing"

export type RequestBody = {
  creation?: WebAuthnCreation
  request: WebAuthnRequest
}

export type ResponseBody = { out: string }

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (req, res) => {
  console.log(
    `[background][messaging][window] Request: ${JSON.stringify(req, null, 2)}`
  )

  const createWindowUrl = `${runtime.getURL("tabs/webauthn.html")}?tabId=${
    req.sender.tab.id
  }&user=${encodeURI(req.body.creation?.user)}&challengeCreation=${req.body
    .creation?.challenge}&credentialId=${
    req.body.request.credentialId
  }&challengeRequest=${req.body.request.challenge}`

  //   const createWindowUrl = `${runtime.getURL(
  //     "tabs/createWebauthn.html"
  //   )}?tabId=${req.sender.tab.id}&user=${encodeURI(
  //     req.body.creation?.user
  //   )}&challengeCreation=${req.body.creation?.challenge}`

  //   const createWindowUrl = `${runtime.getURL(
  //     "tabs/requestWebauthn.html"
  //   )}?tabId=${req.sender.tab.id}&credentialId=${""}&challengeRequest=${
  //     req.body.request.challenge
  //   }`

  console.log(`createWindowUrl: ${createWindowUrl}`)

  const response = await webAuthnWindowAsync(createWindowUrl)
  console.log(
    `[background][messaging][window] response: ${JSON.stringify(
      response,
      null,
      2
    )}`
  )

  //   const tab = await webAuthnTabAsync(createWindowUrl)
  //   console.log(
  //     `[background][messaging][tqb] tab: ${JSON.stringify(tab, null, 2)}`
  //   )

  res.send({
    out: `Opened: ${createWindowUrl}`
  })
}

export default handler
