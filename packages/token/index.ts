import type { HexString } from "~typing"

export type Token = {
  address: HexString
  symbol: string
  decimals: number
}

export type AccountToken = Token & {
  balance: HexString
}

export const ETH: Token = {
  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  symbol: "ETH",
  decimals: 18
}
