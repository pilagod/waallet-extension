import { getAddress, isAddress } from "ethers"

import config from "~config/test"

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

  describe("isContract", () => {
    it("should identify address with code", async () => {
      const counterAddress = Address.wrap(
        await config.contract.counter.getAddress()
      )
      expect(await counterAddress.isContract(config.provider.node)).toBe(true)
    })

    it("should identify address without code", async () => {
      const operatorAddress = Address.wrap(config.wallet.operator.address)

      expect(await operatorAddress.isContract(config.provider.node)).toBe(false)
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

    it("should be able to wrap Address", () => {
      const a1 = Address.wrap(address)
      const a2 = Address.wrap(a1)

      expect(a1.isEqual(a2)).toBe(true)
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
