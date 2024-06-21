import { hashMessage, sha256 } from "ethers"

import { Bytes } from "./bytes"

describe("bytes", () => {
  describe("wrap", () => {
    it("should wrap hex string", () => {
      const hex = "395a7a"
      const bytes = Bytes.wrap(hex)
      expect(bytes.unwrap("hex")).toBe(hex)
    })

    it("should wrap hex string with 0x prefix", () => {
      const hex = "0x395a7a"
      const bytes = Bytes.wrap(hex)
      expect(bytes.unwrap("hex")).toBe(hex.slice(2))
    })

    it("should wrap plain text", () => {
      const message = "Hello World"
      const bytes = Bytes.wrap(message)
      expect(bytes.unwrap()).toBe(message)
    })

    it("should wrap Buffer", () => {
      const message = "Hello World"
      const buffer = Buffer.from(message)
      const bytes = Bytes.wrap(buffer)
      expect(bytes.unwrap()).toBe(message)
    })

    it("should wrap Uint8Array", () => {
      const message = "Hello World"
      const array = Uint8Array.from(Buffer.from(message))
      const bytes = Bytes.wrap(array)
      expect(bytes.unwrap()).toBe(message)
    })
  })

  describe("unwrap", () => {
    it("should unwrap base64url", () => {
      const message = "Hello World"
      const bytes = Bytes.wrap(message)
      expect(bytes.unwrap("base64url")).toBe(
        Buffer.from(message).toString("base64url")
      )
    })
  })

  describe("concat", () => {
    it("should concat bytes", () => {
      const b1 = Bytes.wrap("Hello")
      const b2 = Bytes.wrap(" ")
      const b3 = Bytes.wrap("World")

      const result = b1.concat(b2).concat(b3)

      expect(result.unwrap()).toBe("Hello World")
    })
  })

  describe("hash", () => {
    it("should compute EIP-191 hash", () => {
      const message = "Hello World"

      const result = Bytes.wrap(message).eip191()
      const expected = hashMessage(message)

      expect(result.unwrap("hex")).toBe(expected.slice(2))
    })

    it("should compute sha256 hash", () => {
      const message = "Hello World"

      const result = Bytes.wrap(message).sha256()
      const expected = sha256(Buffer.from(message))

      expect(result.unwrap("hex")).toBe(expected.slice(2))
    })
  })
})
