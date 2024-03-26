import { v4 as uuidv4 } from "uuid"

import type { BackgroundMessage, BackgroundMessenger } from "./index"

export class MainWorldBackgroundMessenger implements BackgroundMessenger {
  public channel = new BroadcastChannel("MainWorld")

  public send<ReqBody, ResBody>(
    msg: BackgroundMessage<ReqBody>
  ): Promise<ResBody> {
    return new Promise((resolve) => {
      const messageId = uuidv4()
      const controller = new AbortController()

      this.channel.addEventListener(
        "message",
        (e) => {
          const shouldRelayMessage =
            e.data.messageId === messageId && this.isMainWorldChannel(e.target)
          if (!shouldRelayMessage) {
            return
          }
          resolve(e.data.body)
          controller.abort()
        },
        {
          signal: controller.signal
        }
      )

      this.channel.postMessage({
        ...msg,
        messageId
      })
    })
  }

  private isMainWorldChannel(target: any) {
    return target instanceof BroadcastChannel && target.name === "MainWorld"
  }
}
