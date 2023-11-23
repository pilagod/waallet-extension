import { type PlasmoMessaging } from "@plasmohq/messaging"

import { getWaalletBackgroundProvider } from "~background/provider"
import { WaalletMessage } from "~packages/provider/waallet/message"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(
    `[background][message][${WaalletMessage.JsonRpcRequest}][request]`,
    req
  )
  const provider = getWaalletBackgroundProvider()
  const result = await provider.request(req.body)
  console.log(
    `[background][message][${WaalletMessage.JsonRpcRequest}][response]`,
    result
  )
  res.send(result)
}

export default handler
