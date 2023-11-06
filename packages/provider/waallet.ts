import rpc, { type RequestArguments } from "./rpc"

export class WaalletProvider {
  public constructor(
    private nodeRpcUrl: string,
    private bundlerRpcUrl: string
  ) {}

  public async request(args: RequestArguments): Promise<any> {
    console.log(args)
    switch (args.method) {
      case rpc.method.eth.accounts:
        return Promise.resolve(["0xeaf6c1a01df4ffdc0e909233e5d95dd2cb657dc1"])
      case rpc.method.eth.chainId:
        return rpc.request(this.bundlerRpcUrl, args)
      default:
        return rpc.request(this.nodeRpcUrl, args)
    }
  }
}
