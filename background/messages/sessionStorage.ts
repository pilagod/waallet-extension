import { type PlasmoMessaging } from "@plasmohq/messaging"

import {
  getSessionStorage,
  SessionStorageAction
} from "~background/storage/session"

async function handler(
  req: PlasmoMessaging.Request,
  res: PlasmoMessaging.Response
) {
  const sessionStorage = await getSessionStorage()
  switch (req.body.action) {
    case SessionStorageAction.Get:
      res.send(sessionStorage.get())
      break
    default:
      throw new Error(`Unknown action ${req.body}`)
  }
}

export default handler
