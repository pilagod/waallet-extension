import { EventEmitter } from "events"

import type {
  WebauthnCreation,
  WebauthnRequest
} from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/webauthn/typing"
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

  // Usage in dapp site:
  //   await (window as any).waallet.createWindow({
  //     creation: {
  //       user: "imToken Labs",
  //       challenge: "5r264oeeza45DAAnFgSNLybypGsY64GeIa2C5UqbmRk",
  //     },
  //     request: {
  //       credentialId: "jyZ19cHuw8toyyZDHxz7dOVmZ00fRSsvm1WSMV9dfRc",
  //       challenge: "5r264oeeza45DAAnFgSNLybypGsY64GeIa2C5UqbmRk",
  //     },
  //   });
  private async createWindow({
    creation: creation,
    request: request
  }: {
    creation: WebauthnCreation
    request: WebauthnRequest
  }): Promise<any> {
    const req = {
      name: "mCreateWindow",
      body: {
        creation: creation,
        request: request
      }
    }
    const res = await this.backgroundMessenger.send(req)
    console.log(
      `[provider][createWindow] response: ${JSON.stringify(res, null, 2)}`
    )
    return res
  }
}
