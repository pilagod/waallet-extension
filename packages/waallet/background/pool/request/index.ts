import type { HexString } from "~typing"

import { TransactionRequest } from "./transaction"

export { TransactionRequest } from "./transaction"

export type Request = TransactionRequest

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
