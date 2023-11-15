import { toBigInt, type BigNumberish } from "ethers"

export default {
  toHex(n: BigNumberish, withPrefix: boolean = true) {
    return (withPrefix ? `0x` : ``) + toBigInt(n).toString(16)
  }
}
