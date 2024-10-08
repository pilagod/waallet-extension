import {
  getAddress,
  Interface,
  parseEther,
  parseUnits,
  zeroPadValue
} from "ethers"

import { decodeExecuteParams } from "~app/util/calldata"
import { AccountType } from "~packages/account"

const transferIface = new Interface([
  "function transfer(address to, uint256 value) public returns (bool)"
])

const executeIface = new Interface([
  "function execute(address dest, uint256 value, bytes func) external"
])

describe("calldata", () => {
  it("should decode the execute calldata", () => {
    const toAddress = getAddress(zeroPadValue("0x1234", 20))
    const etherValue = 0.0
    const tokenAddress = getAddress(zeroPadValue("0x5678", 20))
    const tokenValue = 0.1
    const tokenDecimals = 18

    const accountType = AccountType.SimpleAccount

    const transferCalldata = transferIface.encodeFunctionData("transfer", [
      toAddress,
      parseUnits(tokenValue.toString(), tokenDecimals)
    ])
    const executeCalldata = executeIface.encodeFunctionData("execute", [
      tokenAddress,
      parseEther(etherValue.toString()),
      transferCalldata
    ])

    const { to, value, data } = decodeExecuteParams(
      accountType,
      executeCalldata
    )

    expect(to.toString()).toBe(tokenAddress)
    expect(value).toBe(parseEther(etherValue.toString()))
    expect(data).toBe(transferCalldata)
  })
})
