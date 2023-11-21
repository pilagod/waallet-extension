import type { Message, Messenger } from "./index"

export class StubMessenger implements Messenger {
  public send<Request, Response>(_: Message<Request>): Promise<Response> {
    return null
  }
}
