import axios from "axios"

export class RpcProvider {
  public constructor(public readonly rpcUrl: string) {}

  public async rpcRequest(args: { method: string; params?: any[] }) {
    const { data } = await axios.post(this.rpcUrl, {
      jsonrpc: "2.0",
      id: 0,
      ...args
    })
    // TODO: Should handle error
    // {
    //     jsonrpc: '2.0',
    //     error: { code: -32521, message: "user operation's call reverted: 0x" },
    //     id: 0
    // }
    console.log(data)
    // TODO: Transform error to error instance
    return data.result
  }

  // export async function request<T>(
  // rpcUrl: string,
  // args: RequestArguments
  // ): Promise<T> {
  // const { data } = await axios.post(rpcUrl, {
  //   jsonrpc: "2.0",
  //   id: 0,
  //   ...args
  // })
  // // TODO: Should handle error
  // // {
  // //     jsonrpc: '2.0',
  // //     error: { code: -32521, message: "user operation's call reverted: 0x" },
  // //     id: 0
  // // }
  // console.log(data)
  // // TODO: Transform error to error instance
  // return data.result
  // }
}
