import { type PlasmoMessaging } from "@plasmohq/messaging"

import { getStorage, StorageAction } from "~background/storage"

async function handler(
  req: PlasmoMessaging.Request,
  res: PlasmoMessaging.Response
) {
  const storage = await getStorage()
  switch (req.body.action) {
    case StorageAction.Get:
      res.send(storage.get())
      break
    case StorageAction.Set:
      console.log("[background] Storage update action", req)
      storage.set(req.body.updates, req.body.option)
      break
    default:
      throw new Error(`Unknown action ${req.body}`)
  }
}

export default handler
