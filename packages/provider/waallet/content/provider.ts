import { MessageName, type Messenger } from "../messenger"
import { type WaalletRequestArguments } from "../rpc"

export class WaalletContentProvider {
  public constructor(private backgroundMessenger: Messenger) {}

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    const res = await this.backgroundMessenger.send({
      name: MessageName.JsonRpcRequest,
      body: args
    })
    return res as T
  }
}
