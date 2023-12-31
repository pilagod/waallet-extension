import fetch from "isomorphic-fetch"

import number from "~packages/util/number"

export class JsonRpcProvider {
  public constructor(public readonly rpcUrl: string) {}

  public async send(args: { method: string; params?: any[] }) {
    const body = JSON.stringify(
      {
        jsonrpc: "2.0",
        id: 0,
        ...args
      },
      (k, v) => {
        if (!k || k === "id") {
          return v
        }
        if (["number", "bigint"].includes(typeof v)) {
          return number.toHex(v)
        }
        return v
      }
    )
    console.log(`[JsonRpcProvider][${args.method}][request] ${body}`)
    const res = await fetch(this.rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body
    })
    const data = await res.json()
    // TODO: Should handle error
    // {
    //     jsonrpc: '2.0',
    //     error: { code: -32521, message: "user operation's call reverted: 0x" },
    //     id: 0
    // }
    console.log(
      `[JsonRpcProvider][${args.method}][response] ${JSON.stringify(data)}`
    )
    // TODO: Transform error to error instance
    return data.result
  }
}
