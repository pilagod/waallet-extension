import { type BackgroundMessenger } from "~packages/messenger/background"

import { WaalletMessage } from "../message"
import { type WaalletRequestArguments } from "../rpc"

export class WaalletContentProvider {
  public constructor(private backgroundMessenger: BackgroundMessenger) {}

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
  //     method: "debug_createWindow",
  //     params: [
  //       {
  //         origin: "app.uniswap.org",
  //         account: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  //       },
  //     ],
  //   });
  private async createWindow({
    method,
    params: [{ origin, account }]
  }: {
    method: string
    params: [
      {
        origin: string
        account: string
      }
    ]
  }): Promise<any> {
    const req = {
      name: "mCreateWindow",
      body: {
        method: method,
        params: [
          {
            origin,
            account
          }
        ]
      }
    }
    const res = await this.backgroundMessenger.send(req)
    console.log(
      `[provider][createWindow] response: ${JSON.stringify(res, null, 2)}`
    )
    return res
  }
}
