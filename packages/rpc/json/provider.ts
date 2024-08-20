import fetch from "isomorphic-fetch"

import json, { format, replacer } from "~packages/util/json"

import { ProviderRpcError } from "./error"

export type JsonRpcResponse<T extends any> = {
  jsonrpc: "2.0"
  id: number
  result?: T
  error?: {
    code: number
    message: string
    data?: any
  }
}

export class JsonRpcProvider {
  public constructor(public readonly rpcUrl: string) {}

  public async send<T extends any>(args: {
    method: string
    params?: any[]
  }): Promise<T> {
    try {
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
      const payload: JsonRpcResponse<T> = await res.json()

      if (payload.error) {
        // 200 response but may have issues executing that request
        throw ProviderRpcError.wrap(payload)
      }
      console.log(
        `[JsonRpcProvider][${args.method}][response] ${format(payload)}`
      )
      return payload.result
    } catch (err) {
      console.log(`[JsonRpcProvider][${args.method}][error] ${format(err)}`)
      if (err instanceof ProviderRpcError) {
        throw err
      }
      throw new ProviderRpcError({
        code: -32600,
        message: "Invalid Request"
      })
    }
  }
}
