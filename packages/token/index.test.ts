import { Contract, getAddress, parseUnits, zeroPadValue } from "ethers"

import config from "~config/test"
import { TokenContract } from "~packages/token"
import number from "~packages/util/number"

describe("Token contract", () => {
  let token: TokenContract
  let mintableToken: Contract

  const fromAddress = getAddress(zeroPadValue("0x1234", 20))
  const toAddress = getAddress(zeroPadValue("0x5678", 20))
  const tokenValue = 0.1
  const tokenDecimals = 18

  beforeAll(async () => {
    token = await TokenContract.init(
      config.address.TestToken,
      config.provider.node
    )

    mintableToken = new Contract(
      config.address.TestToken,
      ["function mint(address to, uint256 value)"],
      config.wallet.operator
    )
  })

  it("should encode and decode the token transfer calldata", () => {
    const transferCalldata = TokenContract.encodeTransferData(
      toAddress,
      parseUnits(tokenValue.toString(), tokenDecimals)
    )

    const { to, value } = TokenContract.decodeTransferParam(transferCalldata)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })

  it("should encode and decode the token transfer from calldata", () => {
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
    const amount = parseUnits("100", token.decimals)
    const balanceBefore = number.toBigInt(await token.balanceOf(fromAddress))
    await mintableToken.mint(fromAddress, amount)
    const balanceAfter = number.toBigInt(await token.balanceOf(fromAddress))

    expect(balanceAfter - balanceBefore).toBe(amount)
  })
})
