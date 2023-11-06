import axios from "axios"

type RequestArguments = {
  method: string
  params?: Array<any> | Record<string, any>
}

export class WaalletProvider {
  public constructor(private bundlerUrl: string) {}

  public async request(args: RequestArguments): Promise<any> {
    console.log(args)
    if (args.method === "eth_chainId") {
      return this.rpcRequest(args)
    }
    if (args.method === "eth_accounts") {
      return Promise.resolve(["0x407d73d8a49eeb85d32cf465507dd71d507100c1"])
    }
    throw new Error("unknown method")
  }

  private async rpcRequest(args: RequestArguments): Promise<any> {
    const { data } = await axios.post(this.bundlerUrl, {
      jsonrpc: "2.0",
      id: 1,
      ...args
    })
    return data.result
  }
}
