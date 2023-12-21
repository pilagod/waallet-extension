import { type BackgroundMessage, type BackgroundMessenger } from "./index"

export class BackgroundStubMessenger implements BackgroundMessenger {
  private sentMsgs: BackgroundMessage<any>[] = []
  private msgRes: any = null

  public async send<ReqBody, ResBody>(
    msg: BackgroundMessage<ReqBody>
  ): Promise<ResBody> {
    this.sentMsgs.push(msg)
    return this.msgRes
  }

  public getSentMsg(index: number) {
    return this.sentMsgs[index]
  }

  public getSentMsgs() {
    return this.sentMsgs
  }

  public mockMsgRes(res: any) {
    this.msgRes = res
  }

  public reset() {
    this.sentMsgs = []
    this.msgRes = null
  }
}
