import { EventEmitter } from "events"

import { type BackgroundMessenger } from "~packages/messenger/background"
import type { JsonRpcResponse } from "~packages/rpc/json/provider"
import { format } from "~packages/util/json"
import type { WebAuthnCreation, WebAuthnRequest } from "~packages/webAuthn"

import { WaalletMessage } from "../message"
import { type WaalletRequestArguments } from "../rpc"

type WalletProviderError = Error & {
  code?: number
  data?: unknown
}
export class WaalletContentProvider extends EventEmitter {
  public constructor(private backgroundMessenger: BackgroundMessenger) {
    super()
  }

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    const res: JsonRpcResponse<T> = await this.backgroundMessenger.send({
      name: WaalletMessage.JsonRpcRequest,
      body: args
    })

    // https://github.com/ethers-io/ethers.js/blob/72c2182d01afa855d131e82635dca3da063cfb31/src.ts/providers/provider-browser.ts#L69-L85
    if (res.error) {
      const error: WalletProviderError = new Error(res.error.message)
      error.code = res.error.code
      error.data = res.error.data
      throw error
    }
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
    creation?: WebAuthnCreation
    request: WebAuthnRequest
  }): Promise<any> {
    const req = {
      name: "mCreateWindow",
      body: {
        creation: creation,
        request: request
      }
    }
    const res = await this.backgroundMessenger.send(req)
    console.log(`[provider][createWindow] response: ${format(res)}`)
    return res
  }
}
