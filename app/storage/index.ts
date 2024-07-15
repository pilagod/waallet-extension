import { applyPatches, type Patch } from "immer"
import browser from "webextension-polyfill"
import { create } from "zustand"

import { StorageAction } from "~background/messages/storage"

import { StorageMessenger } from "./messenger"
import { background } from "./middleware/background"
import { createAccountSlice, type AccountSlice } from "./slice/account"
import { createNetworkSlice, type NetworkSlice } from "./slice/network"
import { createStateSlice, type StateSlice } from "./slice/state"
import {
  createTransactionSlice,
  type TransactionSlice
} from "./slice/transaction"

const storageMessenger = new StorageMessenger()

interface Storage
  extends StateSlice,
    AccountSlice,
    NetworkSlice,
    TransactionSlice {}

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
    {
      async set(patches: Patch[]) {
        await storageMessenger.set(
          patches.map((p) => {
            const path = [...p.path]
            if (path[0] === "state") {
              path.shift()
            }
            return { ...p, path }
          })
        )
      },
      sync(get, set) {
        browser.runtime.onMessage.addListener((message) => {
          if (message.action !== StorageAction.Sync) {
            return
          }
          console.log("[popup] Receive state update from background")
          set({ state: applyPatches(get().state, message.patches) })
        })
      }
    }
  )
)

storageMessenger.get().then((state) => {
  useStorage.setStateLocally({ state })
})

// TODO: Remove it after fully migrated
export * from "~app/hook/storage"
