import axios from "axios"

import { type RequestArguments } from "./method"

export * from "./method"

export async function request<T>(
  rpcUrl: string,
  args: RequestArguments
): Promise<T> {
  const { data } = await axios.post(rpcUrl, {
    jsonrpc: "2.0",
    id: 0,
    ...args
  })
  // TODO: Transform error to error instance
  return data.result
}
