import fetch from "isomorphic-fetch"

import json, { format, replacer } from "~packages/util/json"

export class JsonRpcProvider {
  public constructor(public readonly rpcUrl: string) {}

  public async send<T extends any>(args: {
    method: string
    params?: any[]
  }): Promise<T> {
    const body = json.stringify(
      {
        jsonrpc: "2.0",
        id: 0,
        ...args
      },
      (k, v) => {
        if (k === "id") {
          return v
        }
        return replacer.pipe(k, v, [replacer.unwrap, replacer.numberToHex])
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
    console.log(`[JsonRpcProvider][${args.method}][response] ${format(data)}`)
    // TODO: Transform error to error instance
    return data.result as T
  }
}
