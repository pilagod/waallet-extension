import { type PlasmoMessaging } from "@plasmohq/messaging"

import { format } from "~packages/util/json"
import type { WebAuthnCreation, WebAuthnRequest } from "~packages/webAuthn/"
import { testWebAuthn } from "~packages/webAuthn/background"

export type RequestBody = {
  creation?: WebAuthnCreation
  request: WebAuthnRequest
}

export type ResponseBody = { out: string }

const handler: PlasmoMessaging.MessageHandler<
  RequestBody,
  ResponseBody
> = async (req, res) => {
  console.log(`[background][messaging][window] Request: ${format(req)}`)

  const { result } = await testWebAuthn(req.sender.tab.id, {
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
    `[background][messaging][window] response: ${format(await result)}`
  )

  res.send({
    out: `Done`
  })
}

export default handler
