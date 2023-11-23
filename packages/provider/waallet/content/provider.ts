import { WaalletMessageName, type WaalletMessenger } from "../messenger"
import { type WaalletRequestArguments } from "../rpc"

export class WaalletContentProvider {
  public constructor(private backgroundMessenger: WaalletMessenger) {}

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    const res = await this.backgroundMessenger.send({
      name: WaalletMessageName.JsonRpcRequest,
      body: args
    })
    return res as T
  }
}
