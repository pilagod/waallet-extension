import browser from "webextension-polyfill"

import { ObservableStorage } from "~packages/storage/observable"

let sessionStorage: ObservableStorage<SessionState>

export async function getSessionStorage() {
  if (!sessionStorage) {
    const state = await browser.storage.session.get(null)
    sessionStorage = new ObservableStorage({
      isPopupOpened: false,
      ...state
    })
    sessionStorage.subscribe(async (state) => {
      console.log("[background] Write state into session")
      await browser.storage.session.set(state)
    })
  }
  return sessionStorage
}

export type SessionState = {
  isPopupOpened: boolean
}
