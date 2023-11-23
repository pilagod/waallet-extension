import { type PlasmoMessaging } from "@plasmohq/messaging"

import { getWaalletBackgroundProvider } from "~background/provider"
import { WaalletMessageName } from "~packages/provider/waallet/messenger"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(
    `[background][message][${WaalletMessageName.JsonRpcRequest}][request]`,
    req
  )
  const provider = getWaalletBackgroundProvider()
  const result = await provider.request(req.body)
  console.log(
    `[background][message][${WaalletMessageName.JsonRpcRequest}][response]`,
    result
  )
  res.send(result)
}

export default handler
