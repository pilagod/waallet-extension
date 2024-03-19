import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

import { StorageMessenger } from "~background/messages/storage"
import type { State } from "~background/storage"

interface Storage {
  state: State
}

export const useStorage = create<Storage>()(
  immer((set) => ({
    state: null
  }))
)

new StorageMessenger().get().then((state) => {
  useStorage.setState({ state })
})
