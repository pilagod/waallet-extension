import { Method, request, type RequestArguments } from "./rpc"

export class WaalletProvider {
  public constructor(
    private nodeRpcUrl: string,
    private bundlerRpcUrl: string
  ) {}

  public async request(args: RequestArguments): Promise<any> {
    console.log(args)
    switch (args.method) {
      case Method.eth_accounts:
        return Promise.resolve(["0xeaf6c1a01df4ffdc0e909233e5d95dd2cb657dc1"])
      case Method.eth_chainId:
        return request(this.bundlerRpcUrl, args)
      case Method.eth_estimateGas:
        break
      default:
        return request(this.nodeRpcUrl, args)
    }
  }
}
