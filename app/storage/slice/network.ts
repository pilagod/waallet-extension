import type { BackgroundStateCreator } from "../middleware/background"
import type { StateSlice } from "./state"

export interface NetworkSlice {
  switchNetwork: (networkId: string) => Promise<void>
}

export const createNetworkSlice: BackgroundStateCreator<
  StateSlice,
  NetworkSlice
> = (set) => ({
  switchNetwork: async (networkId: string) => {
    await set(({ state }) => {
      if (!state.network[networkId]) {
        throw new Error(`Unknown network: ${networkId}`)
      }
      state.networkActive = networkId
    })
  }
})
