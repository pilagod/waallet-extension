import { type PlasmoMessaging } from "@plasmohq/messaging"

import {
  createWebAuthn,
  requestWebAuthn,
  testWebAuthn
} from "~packages/webAuthn/background/webAuthn"
import type {
  WebAuthnCreation,
  WebAuthnRequest
} from "~packages/webAuthn/typing"

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

  const response = await testWebAuthn(req.sender.tab.id, {
    webAuthnCreation: req.body.creation,
    webAuthnRequest: req.body.request
  })

  //   const response = await createWebAuthn({
  //     user: req.body.creation?.user,
  //     challenge: req.body.creation?.challenge
  //   })

  //   const response = await requestWebAuthn({
  //     credentialId: "",
  //     challenge: req.body.request.challenge
  //   })

  console.log(
    `[background][messaging][window] response: ${JSON.stringify(
      response,
      null,
      2
    )}`
  )

  res.send({
    out: `Done`
  })
}

export default handler
