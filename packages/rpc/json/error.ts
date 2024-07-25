export class JsonRpcError extends Error {
  public readonly code: number
  public readonly data?: unknown

  public static wrap(error: { message: string; code: number; data?: unknown }) {
    return new JsonRpcError(error.message, error.code, error.data)
  }

  public constructor(message: string, code: number, data?: unknown) {
    super(message)
    this.name = "JsonRpcProviderError"
    this.code = code
    this.data = data

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JsonRpcError)
    }
  }

  public unwrap() {
    return {
      message: this.message,
      code: this.code,
      data: this.data
    }
  }
}
