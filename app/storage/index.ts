import { applyPatches, type Patch } from "immer"
import browser from "webextension-polyfill"
import { create, type StoreApi } from "zustand"

import { StorageAction } from "~background/messages/storage"
import { Bytes } from "~packages/primitive"

import { StorageMessenger } from "./messenger"
import { background, type BackgroundStorage } from "./middleware/background"
import { createAccountSlice, type AccountSlice } from "./slice/account"
import { createNetworkSlice, type NetworkSlice } from "./slice/network"
import { createRequestSlice, type RequestSlice } from "./slice/request"
import { createStateSlice, type StateSlice } from "./slice/state"

interface Storage
  extends StateSlice,
    AccountSlice,
    NetworkSlice,
    RequestSlice {}

class StorageSyncer implements BackgroundStorage<Storage> {
  private patchesInSync: Record<string, PromiseWithResolvers<void>> = {}

  public constructor(private messenger: StorageMessenger) {}

  public async set(patches: Patch[]) {
    const patchesForStorage = patches.map((p) => {
      const path = [...p.path]
      if (path[0] === "state") {
        path.shift()
      }
      return { ...p, path }
    })
    await this.messenger.set(patchesForStorage)

    const promiseWithResolvers = Promise.withResolvers<void>()

    this.patchesInSync[this.getPatchesId(patchesForStorage)] =
      promiseWithResolvers

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
    return Bytes.wrap(JSON.stringify(patches)).sha256().unwrap("hex")
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
      ...createRequestSlice(...actions)
    }),
    new StorageSyncer(storageMessenger)
  )
)

storageMessenger.get().then((state) => {
  useStorage.setStateLocally({ state })
})
