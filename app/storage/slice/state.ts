import type { ToastStatus } from "~app/component/toast"
import type { State } from "~storage/local/state"

import type { BackgroundStateCreator } from "../middleware/background"

export interface StateSlice {
  state: State
  setToast: (message: string, status: ToastStatus) => Promise<void>
}

export const createStateSlice: BackgroundStateCreator<StateSlice> = (set) => ({
  state: null,
  setToast: async (message, status) => {
    await set(({ state }) => {
      state.toast = {
        message,
        status
      }
    })
  }
})
