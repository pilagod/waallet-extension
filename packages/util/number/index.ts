import * as ethers from "ethers"

import type { BigNumberish } from "~typing"

/**
 *  Default size is `uint256`
 */
function random(byteSize: number = 32) {
  return ethers.toBigInt(ethers.randomBytes(byteSize))
}

function toBigInt(n: BigNumberish) {
  return ethers.toBigInt(n)
}

function toNumber(n: BigNumberish) {
  return ethers.toNumber(n)
}

function toString(n: BigNumberish) {
  return ethers.toBigInt(n).toString()
}

function toHex(n: BigNumberish, withPrefix: boolean = true) {
  const result = ethers.toBeHex(n)
  return withPrefix ? result : result.slice(2)
}

function formatUnitsToFixed(
  balance: BigNumberish,
  decimals: BigNumberish,
  fixed: number = 6
): string {
  const parseValue = parseFloat(
    ethers.formatUnits(balance, ethers.toNumber(decimals))
  )
  if (isNaN(parseValue) || parseValue === 0) {
    return "0"
  }
  return parseValue.toFixed(fixed)
}

export default {
  random,
  toBigInt,
  toNumber,
  toString,
  toHex,
  formatUnitsToFixed
}
