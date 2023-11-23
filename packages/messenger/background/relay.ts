import { sendToBackgroundViaRelay } from "@plasmohq/messaging"

import { type BackgroundMessage, type BackgroundMessenger } from "./index"

export class BackgroundRelayMessenger implements BackgroundMessenger {
  public send<ReqBody, ResBody>(
    msg: BackgroundMessage<ReqBody>
  ): Promise<ResBody> {
    return sendToBackgroundViaRelay(msg as any)
  }
}
