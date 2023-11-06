import rpc, { type RequestArguments } from "./rpc"

export class WaalletProvider {
  public constructor(private bundlerUrl: string) {}

  public async request(args: RequestArguments): Promise<any> {
    console.log(args)
    if (args.method === rpc.method.ethChainId) {
      return rpc.request(this.bundlerUrl, args)
    }
    if (args.method === rpc.method.ethAccounts) {
      return Promise.resolve(["0x407d73d8a49eeb85d32cf465507dd71d507100c1"])
    }
    throw new Error("unknown method")
  }
}
