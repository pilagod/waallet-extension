import type { Paymaster } from "~packages/paymaster"
import { ETH, Token } from "~packages/token"

export class NullPaymaster implements Paymaster {
  public async getExchangeRate(quote: Token) {
    if (quote !== ETH) {
      throw new Error(`Unsupported token: ${quote.symbol}`)
    }
    return {
      rate: 1n,
      decimals: 0
    }
  }

  public async quoteFee(fee: bigint, quote: Token) {
    if (quote !== ETH) {
      throw new Error(`Unsupported token: ${quote.symbol}`)
    }
    return fee
  }

  public async requestPaymasterAndData() {
    return "0x"
  }
}
