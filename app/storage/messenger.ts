import { sendToBackground, type MessageName } from "@plasmohq/messaging"

import { StorageAction, type State } from "~storage/local"
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
