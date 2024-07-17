import { getAddress, isAddress } from "ethers"

import { Address } from "./address"

describe("Address", () => {
  const address = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"

  describe("ellipsize", () => {
    it("should trim address", () => {
      const a = Address.wrap(address)

      const result = a.ellipsize()

      expect(result.length).toBeLessThan(address.length)

      const [prefix, suffix] = result.split("...")
      const checksum = getAddress(address)

      expect(checksum.startsWith(prefix)).toBe(true)
      expect(checksum.endsWith(suffix)).toBe(true)
    })
  })

  describe("isEqual", () => {
    it("should be able to compare with Address", () => {
      const a1 = Address.wrap(address)
      const a2 = Address.wrap(address)

      expect(a1.isEqual(a2)).toBe(true)
    })

    it("should be able to compare with hex string", () => {
      const a = Address.wrap(address)

      expect(a.isEqual(address)).toBe(true)
    })
  })

  describe("wrap", () => {
    it("should be able to wrap hex string without 0x prefix", () => {
      const a = Address.wrap(address.slice(2))

      expect(a.isEqual(address)).toBe(true)
    })
  })

  describe("unwrap", () => {
    it("should unwrap to checksum address", () => {
      const a = Address.wrap(address)

      const result = a.unwrap()

      expect(isAddress(result)).toBe(true)
      expect(result).toBe(getAddress(address))
    })
  })
})
