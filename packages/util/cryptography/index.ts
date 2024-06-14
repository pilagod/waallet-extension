import { isoUint8Array } from "@simplewebauthn/server/helpers"
import {
  concat,
  getBytes,
  isBytesLike,
  keccak256,
  toUtf8Bytes,
  type BytesLike
} from "ethers"

function toEthSignedMessageHash(message: BytesLike): Uint8Array {
  if (!isBytesLike(message)) {
    throw new Error("Invalid message")
  }

  const messageUint8Array = getBytes(message)
  const prefixBytes = toUtf8Bytes(
    `\x19Ethereum Signed Message:\n${messageUint8Array.byteLength.toString()}`
  )
  return getBytes(keccak256(concat([prefixBytes, messageUint8Array])))
}

export default { toEthSignedMessageHash }
