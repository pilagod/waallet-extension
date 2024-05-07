import browser from "webextension-polyfill"

import { sendToBackground, type MessageName } from "@plasmohq/messaging"

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

/* Session Storage Action */

export enum SessionStorageAction {
  Get = "GetStorage"
}

export class SessionStorageMessenger {
  public get(): Promise<SessionState> {
    return this.send({
      action: SessionStorageAction.Get
    })
  }

  private send(body: any) {
    return sendToBackground({
      name: "sessionStorage" as MessageName,
      body
    })
  }
}

/* Session State */

export type SessionState = {
  isPopupOpened: boolean
}
