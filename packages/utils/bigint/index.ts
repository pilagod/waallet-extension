export default {
  toHex(n: bigint, withPrefix: boolean = true) {
    return (withPrefix ? `0x` : ``) + n.toString(16)
  }
}
