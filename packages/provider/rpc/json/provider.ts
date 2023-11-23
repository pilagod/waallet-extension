import fetch from "isomorphic-fetch"

export class JsonRpcProvider {
  public constructor(public readonly rpcUrl: string) {}

  public async send(args: { method: string; params?: any[] }) {
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 0,
        ...args
      })
    })
    const data = await res.json()

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
}
