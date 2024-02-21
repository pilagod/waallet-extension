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

  public async requestPaymasterAndData() {
    return "0x"
  }
}
