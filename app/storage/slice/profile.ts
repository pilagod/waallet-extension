import type { BackgroundStateCreator } from "../middleware/background"
import type { StateSlice } from "./state"

export interface ProfileSlice {
  switchProfile: (profile: {
    accountId: string
    networkId: string
  }) => Promise<void>
}

export const createProfileSlice: BackgroundStateCreator<
  StateSlice,
  ProfileSlice
> = (set, get) => ({
  switchProfile: async (profile: { accountId: string; networkId: string }) => {
    const { state } = get()
    const networkId = state.networkActive
    const accountId = state.network[networkId].accountActive
    if (accountId === profile.accountId && networkId === profile.networkId) {
      return
    }
    if (
      state.network[profile.networkId].chainId !==
      state.account[profile.accountId].chainId
    ) {
      throw new Error(
        `Account ${profile.accountId} doesn't exist in network ${profile.networkId}`
      )
    }
    await set(({ state }) => {
      state.networkActive = profile.networkId
      state.network[profile.networkId].accountActive = profile.accountId
    })
  }
})
