import { type WaalletMessage, type WaalletMessenger } from "./index"

export class WaalletStubMessenger implements WaalletMessenger {
  public msgs: WaalletMessage<any>[] = []
  private resBody: any = null

  public async send<ReqBody, ResBody>(
    msg: WaalletMessage<ReqBody>
  ): Promise<ResBody> {
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
