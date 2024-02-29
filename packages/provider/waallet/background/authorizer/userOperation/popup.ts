import browser from "webextension-polyfill"

import type { UserOperation } from "~packages/provider/bundler"
import json, { replacer } from "~packages/util/json"

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

      const portOnConnectHandler = (port: browser.Runtime.Port) => {
        if (
          port.sender?.tab?.id !== t.id ||
          port.name !== `PopUpUserOperationAuthorizer#${t.id}`
        ) {
          return
        }
        port.onMessage.addListener(async (message) => {
          console.log("message from popup", message)
          // After popup is initialized, send user opreation to it for authorization.
          if (message.init) {
            port.postMessage({
              userOp: json.stringify(userOp, replacer.numberToHex)
            })
            return
          }
          if (!message.userOpAuthorized) {
            return
          }
          const userOpAuthorized = await onApproved(
            json.parse(message.userOpAuthorized),
            {
              sender: port.sender
            }
          )
          resolve(userOpAuthorized)
          resolved = true
          browser.tabs.remove(t.id)
        })

        port.onDisconnect.addListener(() => {
          if (!resolved) {
            reject("User operation is rejected")
          }
          browser.runtime.onConnect.removeListener(portOnConnectHandler)
        })
      }
      browser.runtime.onConnect.addListener(portOnConnectHandler)
    })
  }
}
