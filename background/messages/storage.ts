import { sendToBackground, type PlasmoMessaging } from "@plasmohq/messaging"

import { getStorage, type State } from "~background/storage"

export class StorageMessenger {
  public get(): Promise<State> {
    return this.send({
      action: StorageAction.Get
    })
  }

  private send(body: any) {
    return sendToBackground({
      name: "storage",
      body
    })
  }
}

enum StorageAction {
  Get = "Get"
}

type StorageRequest = {
  action: StorageAction.Get
}

type StorageResponse = {
  [StorageAction.Get]: State
}

async function handler<T extends StorageRequest>(
  req: PlasmoMessaging.Request<T>,
  res: PlasmoMessaging.Response<StorageResponse[T["action"]]>
) {
  switch (req.body.action) {
    case StorageAction.Get:
      const state = (await getStorage()).get()
      res.send(state)
      break
    default:
      throw new Error(`Unknown action ${req.body.action}`)
  }
}

export default handler
