// TODO: Deprecate this package
import type { HexString } from "~typing"

export type Token = {
  address: HexString
  symbol: string
  decimals: number
}

export const ETH: Token = {
  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  symbol: "ETH",
  decimals: 18
}
