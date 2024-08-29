import type { Paymaster } from "~packages/eip/4337/paymaster"
import { ETH, type Token } from "~packages/token"

export class NullPaymaster implements Paymaster {
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
