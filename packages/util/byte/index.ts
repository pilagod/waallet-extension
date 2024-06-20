/**
 * @deprecated Use `Bytes` in `packages/primitive` instead.
 */
import type { BytesLike } from "~typing"

function isHex(data: string) {
  if (data.startsWith("0x")) {
    return true
  }
  return /^[0-9A-Fa-f]+$/g.test(data)
}

function normalize(data: BytesLike) {
  if (data instanceof Uint8Array) {
    return Buffer.from(data)
  }
  if (isHex(data)) {
    const start = data.startsWith("0x") ? 2 : 0
    return Buffer.from(data.slice(start), "hex")
  }
  return Buffer.from(data)
}

export default { isHex, normalize }
