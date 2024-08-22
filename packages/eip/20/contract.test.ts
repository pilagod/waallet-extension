import { Contract, getAddress, parseUnits, zeroPadValue } from "ethers"

import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"

import { ERC20Contract } from "./contract"

describeWaalletSuite({
  name: "TokenContract instance",
  suite: (ctx) => {
    it("should get balance", async () => {
      const {
        address: { TestToken },
        wallet: { operator }
      } = ctx

      const mintableToken = new Contract(
        TestToken,
        ["function mint(address to, uint256 value)"],
        operator
      )

      const fromAddress = getAddress(zeroPadValue("0x1234", 20))
      const tokenContract = await ERC20Contract.init(TestToken, operator)
      const mintAmount = await tokenContract.parseAmount(100)

      const balanceBefore = await tokenContract.balanceOf(fromAddress)
      await mintableToken.mint(fromAddress, mintAmount)
      const balanceAfter = await tokenContract.balanceOf(fromAddress)

      expect(balanceAfter - balanceBefore).toBe(mintAmount)
    })
  }
})

describe("TokenContract static methods", () => {
  it("should encode and decode the token transfer calldata", () => {
    const toAddress = getAddress(zeroPadValue("0x5678", 20))
    const tokenValue = 0.1
    const tokenDecimals = 18

    const transferCalldata = ERC20Contract.encodeTransferData(
      toAddress,
      parseUnits(tokenValue.toString(), tokenDecimals)
    )

    const { to, value } = ERC20Contract.decodeTransferParam(transferCalldata)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })

  it("should encode and decode the token transfer from calldata", () => {
    const fromAddress = getAddress(zeroPadValue("0x1234", 20))
    const toAddress = getAddress(zeroPadValue("0x5678", 20))
    const tokenValue = 0.1
    const tokenDecimals = 18

    const transferFromCalldata = ERC20Contract.encodeTransferFromData(
      fromAddress,
      toAddress,
      parseUnits(tokenValue.toString(), tokenDecimals)
    )

    const { from, to, value } =
      ERC20Contract.decodeTransferFromParam(transferFromCalldata)

    expect(from).toBe(fromAddress)
    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })
})
