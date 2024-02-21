import type { Paymaster } from "~packages/paymaster"
import { ETH, Token } from "~packages/token"

export class NullPaymaster implements Paymaster {
  public getAcceptedTokens(): Token[] {
    return [ETH]
  }

  public getExchangeRate(base: Token): number {
    if (base !== ETH) {
      throw new Error(`Unsupported token: ${base.symbol}`)
    }
    return 1
  }

  public async requestPaymasterAndData() {
    return "0x"
  }
}
