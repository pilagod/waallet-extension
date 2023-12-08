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
  //     challengeBase64Url: "Pezpmh0P8lXu3tP-V5wSIGnHNVvns0EWyloweQTjmE8",
  //     authAttach: "cross-platform",
  //   });
  private async createWindow({
    user,
    challengeBase64Url,
    authAttach
  }: {
    user?: string
    challengeBase64Url?: string
    authAttach?: AuthenticatorAttachment
  }): Promise<any> {
    const req = {
      name: "mCreateWindow",
      body: {
        user,
        challengeBase64Url,
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
