import type { HexString } from "~typing"

function ellipsize(address: HexString) {
  return (
    address.substring(0, address.startsWith("0x") ? 7 : 5) +
    "..." +
    address.substring(address.length - 5, address.length)
  )
}

export default {
  ellipsize
}
