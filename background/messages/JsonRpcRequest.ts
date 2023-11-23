import { type PlasmoMessaging } from "@plasmohq/messaging"

import { WaalletMessageName } from "~packages/provider/waallet/messenger"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(
    `[background][message][${WaalletMessageName.JsonRpcRequest}][request]`,
    req
  )
  console.log(
    `[background][message][${WaalletMessageName.JsonRpcRequest}][response]`,
    "ok"
  )
  res.send("ok")
}

export default handler
