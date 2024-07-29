import type { JsonRpcResponse } from "./provider"

// https://eips.ethereum.org/EIPS/eip-1193#errors
// ProviderRpcError need to implement code, message, data

export class ProviderRpcError extends Error {
  public readonly code: number
  public readonly message: string
  public readonly data?: unknown

  public static wrap(payload: JsonRpcResponse<unknown>) {
    if (payload.error) {
      return new ProviderRpcError({
        code: payload.error.code,
        message: payload.error.message,
        data: payload.error.data
      })
    } else {
      return new ProviderRpcError({
        code: -32603,
        message: "Internal error: no error object in response"
      })
    }
  }

  public constructor(payload: {
    message: string
    code: number
    data?: unknown
  }) {
    super(payload.message)
    this.name = "JsonRpcError"
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
      error: {
        code: this.code,
        message: this.message,
        data: this.data
      }
    }
  }
}
