import { getBytes, hashMessage, isBytesLike, type BytesLike } from "ethers"

function toEthSignedMessageHash(message: BytesLike): Uint8Array {
  if (!isBytesLike(message)) {
    throw new Error("Invalid message")
  }

  return getBytes(hashMessage(message))
}

export default { toEthSignedMessageHash }
