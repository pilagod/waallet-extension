import { type WaalletRequestArguments } from "../rpc"

export class WaalletContentProvider {
  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    console.log(args)
    return
  }
}
