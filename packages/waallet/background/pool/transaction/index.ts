import type { HexString } from "~typing"

export type Transaction = {
  to: HexString
  value: bigint
  data: HexString
  gasLimit?: bigint
  gasPrice?: bigint
}

export interface TransactionPool {
  /**
   * Send transaction to pool, it would be processed in some future.
   *
   * @return Uuid for this transaction.
   */
  send(data: {
    tx: Transaction
    senderId: string
    networkId: string
  }): Promise<string>

  /**
   * Wait for an transaction to be processed on chain.
   *
   * @param txId: Uuid of the transaction.
   *
   * @return The transaction hash.
   */
  wait(txId: string): Promise<HexString>
}
