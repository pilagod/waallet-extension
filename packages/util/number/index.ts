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

function toHex(n: BigNumberish, withPrefix: boolean = true) {
  const result = ethers.toBeHex(n)
  return withPrefix ? result : result.slice(2)
}

export default {
  random,
  toBigInt,
  toHex
}
