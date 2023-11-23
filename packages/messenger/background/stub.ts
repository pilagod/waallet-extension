import { type BackgroundMessage, type BackgroundMessenger } from "./index"

export class BackgroundStubMessenger implements BackgroundMessenger {
  public msgs: BackgroundMessage<any>[] = []
  private resBody: any = null

  public async send<ReqBody, ResBody>(
    msg: BackgroundMessage<ReqBody>
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
