import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export class TransactionRequest {
  public to: HexString
  public value: bigint
  public data: HexString
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
    this.data = data.data ?? "0x"
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

  public unwrap() {
    return {
      to: this.to,
      value: number.toHex(this.value),
      data: this.data,
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
