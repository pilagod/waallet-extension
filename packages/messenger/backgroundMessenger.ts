import { sendToBackgroundViaRelay, type MessageName } from "@plasmohq/messaging"

import type { Message, Messenger } from "./index"

export class BackgroundMessenger implements Messenger {
  public send<Request, Response>(msg: Message<Request>): Promise<Response> {
    return sendToBackgroundViaRelay({
      name: msg.name as MessageName,
      body: msg.body
    })
  }
}
