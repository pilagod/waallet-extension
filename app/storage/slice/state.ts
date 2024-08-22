import type { State } from "~storage/local/state"

import type { BackgroundStateCreator } from "../middleware/background"

export interface StateSlice {
  state: State
}

export const createStateSlice: BackgroundStateCreator<StateSlice> = (_) => ({
  state: null
})
