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
  return (withPrefix ? `0x` : ``) + ethers.toBigInt(n).toString(16)
}

export default {
  random,
  toBigInt,
  toHex
}
