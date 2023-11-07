import axios from "axios"

import { type RequestArguments } from "./method"

export { Method, type RequestArguments } from "./method"

export async function request(
  rpcUrl: string,
  args: RequestArguments
): Promise<any> {
  const { data } = await axios.post(rpcUrl, {
    jsonrpc: "2.0",
    id: 0,
    ...args
  })
  // TODO: Transform error to error instance
  return data.result
}
