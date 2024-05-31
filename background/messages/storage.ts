import { type PlasmoMessaging } from "@plasmohq/messaging"

import { getLocalStorage } from "~storage/local"

export enum StorageAction {
  Get = "GetStorage",
  Set = "SetStorage",
  Sync = "SyncStorage"
}

async function handler(
  req: PlasmoMessaging.Request,
  res: PlasmoMessaging.Response
) {
  const storage = await getLocalStorage()
  switch (req.body.action) {
    case StorageAction.Get:
      res.send(storage.get())
      break
    case StorageAction.Set:
      console.log("[background] Storage update action", req)
      storage.set(req.body.patches)
      res.send(true)
      break
    case StorageAction.Sync:
      throw new Error("Sync action can only be fired from background")
    default:
      throw new Error(`Unknown action ${req.body}`)
  }
}

export default handler
