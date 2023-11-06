import axios from "axios"

export type RequestArguments = {
  method: string
  params?: Array<any> | Record<string, any>
}

export default {
  method: {
    eth: {
      accounts: "eth_accounts",
      blockNumber: "eth_blockNumber",
      chainId: "eth_chainId"
    }
  },
  async request(rpcUrl: string, args: RequestArguments): Promise<any> {
    const { data } = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: 0,
      ...args
    })
    return data.result
  }
}
