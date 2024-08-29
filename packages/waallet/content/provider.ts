import { EventEmitter } from "events"

import { type BackgroundMessenger } from "~packages/messenger/background"
import { unwrapDeep } from "~packages/primitive"
import { ProviderRpcError } from "~packages/rpc/json/error"
import type { JsonRpcResponse } from "~packages/rpc/json/provider"
import { format } from "~packages/util/json"
import type { WebAuthnCreation, WebAuthnRequest } from "~packages/webAuthn"

import { WaalletMessage } from "../message"
import {
  type WaalletRequestArguments,
  type WaalletRequestArgumentsUnwrappable
} from "../rpc"

export class WaalletContentProvider extends EventEmitter {
  public constructor(private backgroundMessenger: BackgroundMessenger) {
    super()
  }

  public async request<T>(
    args: WaalletRequestArgumentsUnwrappable
  ): Promise<T> {
    if ("params" in args) {
      ;(args.params as any[]) = args.params.map(unwrapDeep)
    }
    const res: JsonRpcResponse<T> = await this.backgroundMessenger.send({
      name: WaalletMessage.JsonRpcRequest,
      body: args as WaalletRequestArguments
    })

    if (res.error) {
      throw ProviderRpcError.wrap(res)
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
