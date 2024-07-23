import { Contract, getAddress, parseUnits, zeroPadValue } from "ethers"

import { TokenContract } from "~packages/token"
import number from "~packages/util/number"
import { WaalletSuiteContext } from "~packages/util/testing/suite/waallet"

const ctx = new WaalletSuiteContext()
const {
  address: { TestToken },
  wallet: { operator }
} = ctx

const mintableToken = new Contract(
  TestToken,
  ["function mint(address to, uint256 value)"],
  operator
)

describe("Token contract", () => {
  it("should encode and decode the token transfer calldata", () => {
    const toAddress = getAddress(zeroPadValue("0x5678", 20))
    const tokenValue = 0.1
    const tokenDecimals = 18

    const transferCalldata = TokenContract.encodeTransferData(
      toAddress,
      parseUnits(tokenValue.toString(), tokenDecimals)
    )

    const { to, value } = TokenContract.decodeTransferParam(transferCalldata)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })

  it("should encode and decode the token transfer from calldata", () => {
    const fromAddress = getAddress(zeroPadValue("0x1234", 20))
    const toAddress = getAddress(zeroPadValue("0x5678", 20))
    const tokenValue = 0.1
    const tokenDecimals = 18

    const transferFromCalldata = TokenContract.encodeTransferFromData(
      fromAddress,
      toAddress,
      parseUnits(tokenValue.toString(), tokenDecimals)
    )

    const { from, to, value } =
      TokenContract.decodeTransferFromParam(transferFromCalldata)

    expect(from).toBe(fromAddress)
    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })

  it("should get balance", async () => {
    const fromAddress = getAddress(zeroPadValue("0x1234", 20))
    const tokenContract = await TokenContract.init(TestToken, operator)
    const amount = tokenContract.parseAmount(100)

    const balanceBefore = number.toBigInt(
      await tokenContract.balanceOf(fromAddress)
    )
    await mintableToken.mint(fromAddress, amount)
    const balanceAfter = number.toBigInt(
      await tokenContract.balanceOf(fromAddress)
    )

    expect(balanceAfter - balanceBefore).toBe(amount)
  })
})
