import * as ethers from "ethers"

import type { BigNumberish } from "~typing"

export default {
  /**
   *  Default size is `uint256`
   */
  random(byteSize: number = 32) {
    return ethers.toBigInt(ethers.randomBytes(byteSize))
  },
  toHex(n: BigNumberish, withPrefix: boolean = true) {
    return (withPrefix ? `0x` : ``) + ethers.toBigInt(n).toString(16)
  }
}
