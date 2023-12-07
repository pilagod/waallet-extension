import { EventEmitter } from "events"

import { type BackgroundMessenger } from "~packages/messenger/background"

import { WaalletMessage } from "../message"
import { type WaalletRequestArguments } from "../rpc"

export class WaalletContentProvider extends EventEmitter {
  public constructor(private backgroundMessenger: BackgroundMessenger) {
    super()
  }

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    const res = await this.backgroundMessenger.send({
      name: WaalletMessage.JsonRpcRequest,
      body: args
    })
    return res as T
  }

  // Demo code
  // Usage:
  //   await (window as any).waallet.createWindow({
  //     user: "imToken Labs",
  //     chalBase64Url: "",
  //     authAttach: "cross-platform",
  //   });
  private async createWindow({
    user,
    chalBase64Url,
    authAttach
  }: {
    user?: string
    chalBase64Url?: string
    authAttach?: AuthenticatorAttachment
  }): Promise<any> {
    const req = {
      name: "mCreateWindow",
      body: {
        user,
        chalBase64Url,
        authAttach
      }
    }
    const res = await this.backgroundMessenger.send(req)
    console.log(
      `[provider][createWindow] response: ${JSON.stringify(res, null, 2)}`
    )
    return res
  }
}
