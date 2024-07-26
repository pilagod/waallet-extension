import { format } from "util"

import { type PlasmoMessaging } from "@plasmohq/messaging"

import { getWaalletBackgroundProvider } from "~background/provider"
import { JsonRpcError } from "~packages/rpc/json/error"
import { WaalletMessage } from "~packages/waallet/message"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log(
    `[background][message][${WaalletMessage.JsonRpcRequest}][request]`,
    req
  )
  try {
    const provider = getWaalletBackgroundProvider()
    const result = await provider.request(req.body)
    console.log(
      `[background][message][${WaalletMessage.JsonRpcRequest}][response]`,
      result
    )
    res.send(result)
  } catch (error) {
    if (error instanceof JsonRpcError) {
      console.log(
        `[background][message][${WaalletMessage.JsonRpcRequest}][JsonRpcProviderError]`,
        error.unwrap()
      )
      res.send(error.unwrap())
      return
    }
    console.log(
      "[background][message][JsonRpcRequest][InternalError]",
      format(error)
    )
    const internalError = new JsonRpcError({
      jsonrpc: "2.0",
      id: 0,
      error: {
        code: -32603,
        message: "Internal error",
        data: error.message
      }
    })
    res.send(internalError.unwrap())
  }
}

export default handler
