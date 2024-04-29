import { v4 as uuidv4 } from "uuid"

import type { BackgroundMessage, BackgroundMessenger } from "./index"

export class MainWorldBackgroundMessenger implements BackgroundMessenger {
  public channelToMainWorld = new BroadcastChannel("MainWorld")
  public channelToContentScript = new BroadcastChannel("ContentScript")

  public send<ReqBody, ResBody>(
    msg: BackgroundMessage<ReqBody>
  ): Promise<ResBody> {
    return new Promise((resolve) => {
      const messageId = uuidv4()
      // NOTE: Use signal of AbortController to remove handler
      // would accidently affect other handlers but don't know the reason.
      const mainWorldMessageHandler = (
        e: MessageEvent<{ messageId: string; name: string; body: any }>
      ) => {
        const shouldRelayMessage = e.data.messageId === messageId
        if (!shouldRelayMessage) {
          return
        }
        resolve(e.data.body)
        this.channelToMainWorld.removeEventListener(
          "message",
          mainWorldMessageHandler
        )
      }
      this.channelToMainWorld.addEventListener(
        "message",
        mainWorldMessageHandler
      )

      this.channelToContentScript.postMessage({
        ...msg,
        messageId
      })
    })
  }
}
