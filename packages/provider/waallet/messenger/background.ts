import { sendToBackgroundViaRelay } from "@plasmohq/messaging"

import { type WaalletMessage, type WaalletMessenger } from "./index"

export class WaalletBackgroundMessenger implements WaalletMessenger {
  public send<ReqBody, ResBody>(
    msg: WaalletMessage<ReqBody>
  ): Promise<ResBody> {
    return sendToBackgroundViaRelay(msg as any)
  }
}
