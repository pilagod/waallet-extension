import { getAddress, Interface, parseUnits, zeroPadValue } from "ethers"

import { Token } from "~packages/token"

describe("calldata", () => {
  const accountAbi: string[] = [
    "function transfer(address to, uint256 value) public returns (bool)"
  ]
  const toAddress = getAddress(zeroPadValue("0x1234", 20))
  const tokenValue = 0.1
  const tokenDecimals = 18

  const transferIface = new Interface(accountAbi)

  const transferCalldata = transferIface.encodeFunctionData("transfer", [
    toAddress,
    parseUnits(tokenValue.toString(), tokenDecimals)
  ])

  it("should decode the token transfer calldata", () => {
    const { to, value } = Token.decodeTransferParam(transferCalldata)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })
})
