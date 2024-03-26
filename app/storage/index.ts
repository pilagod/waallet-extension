import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { useShallow } from "zustand/react/shallow"

import { StorageMessenger } from "~background/messages/storage"
import type { State } from "~background/storage"

interface Storage {
  state: State
}

export const useStorage = create<Storage>()(
  immer((_) => ({
    state: null
  }))
)

export const useNetwork = () => {
  return useStorage(
    useShallow((storage) => storage.state.network[storage.state.networkActive])
  )
}

export const useAccount = () => {
  return useStorage(
    useShallow((storage) => {
      const network = storage.state.network[storage.state.networkActive]
      return storage.state.account[network.accountActive]
    })
  )
}

new StorageMessenger().get().then((state) => {
  useStorage.setState({ state })
})
