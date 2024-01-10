import browser from "webextension-polyfill"

import type { UserOperation } from "~packages/provider/bundler/typing"
import json from "~packages/util/json"

import {
  type UserOperationAuthorizeCallback,
  type UserOperationAuthorizer
} from "./index"

export class PopUpUserOperationAuthorizer implements UserOperationAuthorizer {
  public async authorize(
    userOp: UserOperation,
    { onApproved }: UserOperationAuthorizeCallback
  ) {
    return new Promise<UserOperation>(async (resolve, reject) => {
      let resolved = false

      const w = await browser.windows.create({
        url: browser.runtime.getURL("tabs/userOperationAuthorization.html"),
        type: "popup",
        width: 480,
        height: 720,
        focused: true
      })
      const [t] = w.tabs.filter((t) => t.active)

      const onMessageHandler = async (
        message: any,
        sender: browser.Runtime.MessageSender
      ) => {
        console.group("onMessageHandler")
        console.log("message:", message)
        console.log("sender", sender)
        if (sender.tab.id === t.id) {
          const userOpAuthorized = await onApproved(
            json.parse(message.userOp) as UserOperation
          )
          resolve(userOpAuthorized)
          resolved = true
          browser.tabs.remove(t.id)
        } else {
          console.log(
            `Ignore message from tab other than ${t.id}: ${sender.tab.id}`
          )
        }
        console.groupEnd()
      }
      browser.runtime.onMessage.addListener(onMessageHandler)

      const onTabUpdatedHandler = async (
        tabId: number,
        changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
        tab: browser.Tabs.Tab
      ) => {
        console.group("onTabUpdatedHandler")
        console.log("tab:", tabId, tab)
        console.log("change info:", changeInfo)
        console.groupEnd()
        if (tabId !== t.id) {
          return
        }
        if (changeInfo.status !== "complete") {
          return
        }
        const { status } = await browser.tabs.sendMessage(t.id, {
          userOp: json.stringify(userOp)
        })
        if (status !== 0) {
          // TODO: Retry when no status or its value is other than 0,
        }
      }
      browser.tabs.onUpdated.addListener(onTabUpdatedHandler)

      const onTabClosedHandler = (
        tabId: number,
        removeInfo: browser.Tabs.OnRemovedRemoveInfoType
      ) => {
        console.group("onTabClosedHandler")
        console.log("tab id:", tabId)
        console.log("remove info:", removeInfo)
        console.groupEnd()
        if (!resolved) {
          reject("UserOperation is rejected")
        }
        browser.runtime.onMessage.removeListener(onMessageHandler)
        browser.tabs.onUpdated.removeListener(onTabUpdatedHandler)
        browser.tabs.onRemoved.removeListener(onTabClosedHandler)
      }
      browser.tabs.onRemoved.addListener(onTabClosedHandler)
    })
  }
}
