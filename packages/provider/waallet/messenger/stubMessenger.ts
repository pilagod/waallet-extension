import { type Message, type Messenger } from "./index"

export class StubMessenger implements Messenger {
  public msgs: Message<any>[] = []
  private resBody: any = null

  public async send<ReqBody, ResBody>(msg: Message<ReqBody>): Promise<ResBody> {
    this.msgs.push(msg)
    return this.resBody
  }

  public mockResBody(resBody: any) {
    this.resBody = resBody
  }

  public reset() {
    this.msgs = []
    this.resBody = null
  }
}
