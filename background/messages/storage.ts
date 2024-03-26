import {
  sendToBackground,
  type MessageName,
  type PlasmoMessaging
} from "@plasmohq/messaging"

import { getStorage, type State } from "~background/storage"
import type { RecursivePartial } from "~typing"

export class StorageMessenger {
  public get(): Promise<State> {
    return this.send({
      action: StorageAction.Get
    })
  }

  public set(
    updates: RecursivePartial<State>,
    option: { override?: boolean } = {}
  ) {
    return this.send({
      action: StorageAction.Set,
      updates,
      option
    })
  }

  private send(body: any) {
    return sendToBackground({
      name: "storage" as MessageName,
      body
    })
  }
}

enum StorageAction {
  Get = "Get",
  Set = "Set"
}

type StorageRequest = {
  [StorageAction.Get]: {
    action: StorageAction.Get
  }
  [StorageAction.Set]: {
    action: StorageAction.Set
    updates: RecursivePartial<State>
    option: { override?: boolean }
  }
}

type StorageResponse = {
  [StorageAction.Get]: State
  [StorageAction.Set]: void
}

async function handler<A extends StorageAction>(
  req: PlasmoMessaging.Request<string, StorageRequest[A]>,
  res: PlasmoMessaging.Response<StorageResponse[A]>
) {
  const storage = await getStorage()
  switch (req.body.action) {
    case StorageAction.Get:
      ;(
        res as PlasmoMessaging.Response<StorageResponse[StorageAction.Get]>
      ).send(storage.get())
      break
    case StorageAction.Set:
      storage.set(req.body.updates, req.body.option)
      break
    default:
      throw new Error(`Unknown action ${req.body}`)
  }
}

export default handler
