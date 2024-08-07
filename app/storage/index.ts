import { applyPatches, type Patch } from "immer"
import browser from "webextension-polyfill"
import { create, type StoreApi } from "zustand"

import { StorageAction } from "~background/messages/storage"

import { StorageMessenger } from "./messenger"
import { background, type BackgroundStorage } from "./middleware/background"
import { createAccountSlice, type AccountSlice } from "./slice/account"
import { createNetworkSlice, type NetworkSlice } from "./slice/network"
import { createStateSlice, type StateSlice } from "./slice/state"
import {
  createTransactionSlice,
  type TransactionSlice
} from "./slice/transaction"

interface Storage
  extends StateSlice,
    AccountSlice,
    NetworkSlice,
    TransactionSlice {}

class BackgroundStorageMessenger implements BackgroundStorage<Storage> {
  private patchesInSync: Record<string, PromiseWithResolvers<void>> = {}

  public constructor(private messenger: StorageMessenger) {}

  public async set(patches: Patch[]) {
    await this.messenger.set(
      patches.map((p) => {
        const path = [...p.path]
        if (path[0] === "state") {
          path.shift()
        }
        return { ...p, path }
      })
    )
    const promiseWithResolvers = Promise.withResolvers<void>()

    this.patchesInSync[this.getPatchesId(patches)] = promiseWithResolvers

    return promiseWithResolvers.promise
  }

  public sync(
    get: StoreApi<Storage>["getState"],
    set: StoreApi<Storage>["setState"]
  ) {
    browser.runtime.onMessage.addListener((message) => {
      if (message.action !== StorageAction.Sync) {
        return
      }
      console.log(
        "[popup] Receive state update from background",
        message.patches
      )
      set({ state: applyPatches(get().state, message.patches) })

      const patchesId = this.getPatchesId(message.patches)
      if (patchesId in this.patchesInSync) {
        this.patchesInSync[patchesId].resolve()
        delete this.patchesInSync[patchesId]
      }
    })
  }

  private getPatchesId(patches: Patch[]) {
    return JSON.stringify(patches)
  }
}

const storageMessenger = new StorageMessenger()

// @dev: This background middleware sends state first into background storage.
// To apply new state, listen to background message in `sync` function and call `set` to update app state.
export const useStorage = create<Storage>()(
  background(
    (...actions) => ({
      ...createStateSlice(...actions),
      ...createAccountSlice(...actions),
      ...createNetworkSlice(...actions),
      ...createTransactionSlice(...actions)
    }),
    new BackgroundStorageMessenger(storageMessenger)
  )
)

storageMessenger.get().then((state) => {
  useStorage.setStateLocally({ state })
})

// TODO: Remove it after fully migrated
export * from "~app/hook/storage"
