import fetch from "isomorphic-fetch"

import json, { format, replacer } from "~packages/util/json"

import { JsonRpcError } from "./error"

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
          return replacer.numberToHex(k, v)
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
        throw JsonRpcError.wrap(payload)
      }
      console.log(
        `[JsonRpcProvider][${args.method}][response] ${format(payload)}`
      )
      return payload.result
    } catch (err) {
      console.log(`[JsonRpcProvider][${args.method}][error] ${format(err)}`)
      if (err instanceof JsonRpcError) {
        throw err
      }

      throw new JsonRpcError({
        jsonrpc: "2.0",
        id: 0,
        error: {
          code: -32600,
          message: "Invalid Request"
        }
      })
    }
  }
}
