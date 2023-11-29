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
}
