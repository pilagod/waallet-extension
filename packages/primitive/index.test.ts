import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers"
import { hashMessage, sha256 } from "ethers"

import { Bytes } from "~packages/primitive"

describe("bytes", () => {
  const hexString = "395A7a"
  const hexStringWithPrefix = "0x" + hexString
  const plainTextData = "9Zz"
  const uint8ArrayData = new Uint8Array([57, 90, 122])
  const bufferData = Buffer.from([57, 90, 122])

  it("should wrap data", () => {
    // Test wrapping hex data
    const bytesFromHex = Bytes.wrap(hexString)
    const expectedBytesFromHex = isoUint8Array.fromHex(hexString)
    expect(equals(bytesFromHex, expectedBytesFromHex)).toBe(true)

    const bytesFromHexWithPrefix = Bytes.wrap(hexStringWithPrefix)
    expect(equals(bytesFromHexWithPrefix, expectedBytesFromHex)).toBe(true)

    // Test wrapping plain text data
    const bytesFromPlainText = Bytes.wrap(plainTextData)
    const expectedBytesFromPlainText =
      isoUint8Array.fromUTF8String(plainTextData)
    expect(equals(bytesFromPlainText, expectedBytesFromPlainText)).toBe(true)

    // Test wrapping Uint8Array data
    const bytesFromUint8Array = Bytes.wrap(uint8ArrayData)
    expect(equals(bytesFromUint8Array, uint8ArrayData)).toBe(true)

    // Test wrapping Buffer data
    const bytesFromBuffer = Bytes.wrap(bufferData)
    expect(equals(bytesFromBuffer, bufferData)).toBe(true)
  })

  it("should unwrap data to base64url", () => {
    // Test unwrapping hex data to base64url
    const bytesFromHex = Bytes.wrap(hexString).unwrap("base64url")
    const expectedBase64FromHex = isoBase64URL.fromBuffer(
      isoUint8Array.fromHex(hexString)
    )
    expect(bytesFromHex).toBe(expectedBase64FromHex)

    const bytesFromHexWithPrefix =
      Bytes.wrap(hexStringWithPrefix).unwrap("base64url")
    expect(bytesFromHexWithPrefix).toBe(expectedBase64FromHex)

    // Test unwrapping plain text data to base64url
    const bytesFromPlainText = Bytes.wrap(plainTextData).unwrap("base64url")
    const expectedBase64FromPlainText = isoBase64URL.fromString(plainTextData)
    expect(bytesFromPlainText).toBe(expectedBase64FromPlainText)

    // Test unwrapping Uint8Array data to base64url
    const bytesFromUint8Array = Bytes.wrap(uint8ArrayData).unwrap("base64url")
    const expectedBase64FromUint8Array = isoBase64URL.fromBuffer(uint8ArrayData)
    expect(bytesFromUint8Array).toBe(expectedBase64FromUint8Array)

    // Test unwrapping Buffer data to base64url
    const bytesFromBuffer = Bytes.wrap(bufferData).unwrap("base64url")
    const expectedBase64FromBuffer = isoBase64URL.fromBuffer(bufferData)
    expect(bytesFromBuffer).toBe(expectedBase64FromBuffer)
  })

  describe("should concat two Bytes", () => {
    it("should concatenate two Bytes instances", () => {
      const bytes1 = Bytes.wrap(uint8ArrayData)
      const bytes2 = Bytes.wrap(uint8ArrayData)
      const bytesConcat = bytes1.concat(bytes2)
      const expectResult = isoUint8Array.concat([
        uint8ArrayData,
        uint8ArrayData
      ])

      expect(equals(bytesConcat, expectResult)).toBe(true)
    })
  })

  it("should return the EIP-191 hash", () => {
    const bytesFromPlainText = Bytes.wrap(plainTextData).eip191().unwrap("hex")
    const expectedHash = hashMessage(plainTextData).slice(2)

    expect(bytesFromPlainText).toBe(expectedHash)
  })

  it("should return the sha256 hash", () => {
    const bytesFromPlainText = Bytes.wrap(plainTextData).sha256().unwrap("hex")
    const expectedHash = sha256(
      isoUint8Array.fromUTF8String(plainTextData)
    ).slice(2)

    expect(bytesFromPlainText).toBe(expectedHash)
  })
})

const equals = (bytes: Bytes, other: Buffer | Uint8Array) => {
  const o = Uint8Array.from(other)
  const b = Uint8Array.from(bytes)
  if (b.length !== o.length) {
    return false
  }
  for (let i = 0; i < b.length; i++) {
    if (bytes[i] !== b[i]) {
      return false
    }
  }
  return true
}
