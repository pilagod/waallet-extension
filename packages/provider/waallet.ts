type RequestArguments = {
  method: string
  params?: Array<any> | Record<string, any>
}

export class WaalletProvider {
  public async request(args: RequestArguments): Promise<any> {
    console.log(args)
    if (args.method === "eth_chainId") {
      return Promise.resolve(31337)
    }
    if (args.method === "eth_accounts") {
      return Promise.resolve(["0x407d73d8a49eeb85d32cf465507dd71d507100c1"])
    }
    throw new Error("unknown method")
  }
}
