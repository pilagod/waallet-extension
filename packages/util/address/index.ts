import type { HexString } from "~typing"

function isEqual(a1: HexString, a2: HexString) {
  return a1.toLowerCase() === a2.toLowerCase()
}

function ellipsize(address: HexString) {
  return (
    address.substring(0, address.startsWith("0x") ? 7 : 5) +
    "..." +
    address.substring(address.length - 5, address.length)
  )
}

export default {
  isEqual,
  ellipsize
}
