import type { JsonRpcResponse } from "./provider"

export class JsonRpcError extends Error {
  public readonly jsonrpc: string
  public readonly id: number
  public readonly error: {
    code: number
    message: string
    data?: unknown
  }

  public static wrap(payload: JsonRpcResponse<unknown>) {
    return new JsonRpcError(payload)
  }

  public constructor(payload: JsonRpcResponse<unknown>) {
    super(payload.error.message)
    this.name = "JsonRpcError"
    this.jsonrpc = payload.jsonrpc
    this.id = payload.id
    this.error = payload.error

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JsonRpcError)
    }
  }

  public unwrap() {
    return {
      jsonrpc: this.jsonrpc,
      id: this.id,
      error: this.error
    }
  }
}
