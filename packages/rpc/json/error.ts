import type { JsonRpcResponse } from "./provider"

// https://eips.ethereum.org/EIPS/eip-1193#errors
// ProviderRpcError need to implement code, message, data

export class ProviderRpcError extends Error {
  public readonly code: number
  public readonly message: string
  public readonly data?: unknown
  public readonly jsonrpc?: string
  public readonly id?: number

  public static wrap(payload: JsonRpcResponse<unknown>) {
    if (payload.error) {
      return new ProviderRpcError({
        jsonrpc: payload.jsonrpc,
        id: payload.id,
        code: payload.error.code,
        message: payload.error.message,
        data: payload.error.data
      })
    } else {
      return new ProviderRpcError({
        jsonrpc: payload.jsonrpc,
        id: payload.id,
        code: -32603,
        message: "Internal error: no error object in response"
      })
    }
  }

  public constructor(payload: {
    jsonrpc: string
    id: number
    message: string
    code: number
    data?: unknown
  }) {
    super(payload.message)
    this.name = "JsonRpcError"
    this.jsonrpc = payload.jsonrpc || "2.0"
    this.id = payload.id ?? 0
    this.code = payload.code
    this.message = payload.message
    this.data = payload.data

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProviderRpcError)
    }
  }

  public unwrap() {
    // unwrap to JSON-RPC error object
    return {
      jsonrpc: this.jsonrpc,
      id: this.id,
      error: {
        code: this.code,
        message: this.message,
        data: this.data
      }
    }
  }
}
