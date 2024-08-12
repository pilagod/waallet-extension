import type { HexString } from "~typing"

import { Eip712Request } from "./eip712"
import { TransactionRequest } from "./transaction"

export { Eip712Request } from "./eip712"
export { TransactionRequest } from "./transaction"

export type Request = TransactionRequest | Eip712Request

export interface RequestPool {
  /**
   * Send request to pool, it would be processed in some future.
   *
   * @return Uuid for this request.
   */
  send(data: {
    request: Request
    accountId: string
    networkId: string
  }): Promise<string>

  /**
   * Wait for the request to be processed.
   *
   * @param requestId: Uuid of the request.
   *
   * @return Transaction hash for `TransactionRequest`
   */
  wait(requestId: string): Promise<HexString>
}
