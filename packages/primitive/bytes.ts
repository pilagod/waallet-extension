import { hashMessage, sha256 } from "ethers"

import type { HexString } from "~typing"

export class Bytes extends Uint8Array {
  public static wrap(data: Buffer | Uint8Array | HexString) {
    if (typeof data === "string") {
      // Data is hex string
      if (/^(0x)?[0-9A-Fa-f]+$/g.test(data)) {
        return new Bytes(
          Uint8Array.from(Buffer.from(data.replace(/^0x/g, ""), "hex"))
        )
      }
      // Data is plain text
      return new Bytes(Uint8Array.from(Buffer.from(data)))
    }
    // Data is Buffer or Uint8Array
    return new Bytes(Uint8Array.from(data))
  }

  public concat(bytes: Bytes) {
    return Bytes.wrap(Uint8Array.from([...this, ...bytes]))
  }

  public eip191() {
    const hash = hashMessage(this)
    return Bytes.wrap(hash)
  }

  public sha256() {
    const hash = sha256(this)
    return Bytes.wrap(hash)
  }

  public unwrap(encoding: BufferEncoding = "utf8") {
    // Buffer in browser doesn't support base64url encoding.
    // https://github.com/blakeembrey/universal-base64url/blob/master/src/index.ts
    if (encoding === "base64url") {
      return Buffer.from(this)
        .toString("base64")
        .replace(/\//g, "_")
        .replace(/\+/g, "-")
        .replace(/=+$/, "")
    }
    return Buffer.from(this).toString(encoding)
  }
}
