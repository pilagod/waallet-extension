import { sendToBackground } from "@plasmohq/messaging"

import { type BackgroundMessage, type BackgroundMessenger } from "./index"

export class BackgroundDirectMessenger implements BackgroundMessenger {
  public send<ReqBody, ResBody>(
    msg: BackgroundMessage<ReqBody>
  ): Promise<ResBody> {
    return sendToBackground(msg as any)
  }
}
