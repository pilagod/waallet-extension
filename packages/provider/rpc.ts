import axios from "axios"

export type RequestArguments = {
  method: string
  params?: Array<any> | Record<string, any>
}

export default {
  method: {
    ethAccounts: "eth_accounts",
    ethChainId: "eth_chainId"
  },

  async request(rpcUrl: string, args: RequestArguments): Promise<any> {
    const { data } = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      ...args
    })
    return data.result
  }
}
