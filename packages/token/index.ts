import type { HexString } from "~typing"

export class Token {
  public constructor(
    public readonly address: HexString,
    public readonly symbol: string,
    public readonly decimals: number
  ) {}
}

// TODO: Network specific
export const ETH = new Token(
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "ETH",
  18
)
