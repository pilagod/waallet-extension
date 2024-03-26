import { v4 as uuidv4 } from "uuid"

import type { BackgroundMessage, BackgroundMessenger } from "./index"

export class MainWorldBackgroundMessenger implements BackgroundMessenger {
  public channelMainWorld = new BroadcastChannel("MainWorld")
  public channelContentScript = new BroadcastChannel("ContentScript")

  public send<ReqBody, ResBody>(
    msg: BackgroundMessage<ReqBody>
  ): Promise<ResBody> {
    return new Promise((resolve) => {
      const messageId = uuidv4()
      const mainWorldMessageHandler = (e) => {
        const shouldRelayMessage = e.data.messageId === messageId
        if (!shouldRelayMessage) {
          return
        }
        resolve(e.data.body)
        this.channelMainWorld.removeEventListener(
          "message",
          mainWorldMessageHandler
        )
      }
      this.channelMainWorld.addEventListener("message", mainWorldMessageHandler)

      this.channelContentScript.postMessage({
        ...msg,
        messageId
      })
    })
  }
}
