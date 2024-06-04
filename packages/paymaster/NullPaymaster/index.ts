import type { Paymaster } from "~packages/paymaster"
import { ETH, Token } from "~packages/token"

export class NullPaymaster implements Paymaster {
  public async quoteFee(fee: bigint, quote: Token) {
    if (quote !== ETH) {
      throw new Error(`Unsupported token: ${quote.symbol}`)
    }
    return fee
  }

  public async requestPaymasterAndData() {
    return {
      paymaster: "0x",
      paymasterData: "0x"
    }
  }
}
