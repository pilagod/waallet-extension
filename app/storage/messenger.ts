import type { Patch } from "immer"

import { sendToBackground, type MessageName } from "@plasmohq/messaging"

import { StorageAction } from "~background/messages/storage"
import type { State } from "~storage/local/state"

export class StorageMessenger {
  public get(): Promise<State> {
    return this.send({
      action: StorageAction.Get
    })
  }

  public set(patches: Patch[]) {
    return this.send({
      action: StorageAction.Set,
      patches
    })
  }

  private send(body: any) {
    return sendToBackground({
      name: "storage" as MessageName,
      body
    })
  }
}
