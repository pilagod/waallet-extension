import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export class Transaction {
  public to: HexString
  public value: bigint
  public callData: HexString
  public nonce?: bigint
  public gasLimit?: bigint
  public gasPrice?: bigint

  public constructor(data: {
    to: HexString
    value?: BigNumberish
    data?: HexString
    nonce?: BigNumberish
    gasLimit?: BigNumberish
    gasPrice?: BigNumberish
  }) {
    this.to = data.to
    this.value = number.toBigInt(data.value ?? 0n)
    this.callData = data.data ?? "0x"
    if (data.nonce) {
      this.nonce = number.toBigInt(data.nonce)
    }
    if (data.gasLimit) {
      this.gasLimit = number.toBigInt(data.gasLimit)
    }
    if (data.gasPrice) {
      this.gasPrice = number.toBigInt(data.gasPrice)
    }
  }

  public data() {
    return {
      to: this.to,
      value: number.toHex(this.value),
      data: this.callData,
      ...(this.nonce && {
        nonce: number.toHex(this.nonce)
      }),
      ...(this.gasLimit && {
        gasLimit: number.toHex(this.gasLimit)
      }),
      ...(this.gasPrice && {
        gasPrice: number.toHex(this.gasPrice)
      })
    }
  }
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
