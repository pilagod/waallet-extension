import {
  getAddress,
  Interface,
  parseEther,
  parseUnits,
  zeroPadValue
} from "ethers"

import { decodeExecuteParams } from "~app/util/calldata"
import { AccountType } from "~packages/account"

describe("calldata", () => {
  const accountAbi: string[] = [
    "function transfer(address to, uint256 value) public returns (bool)"
  ]

  const toAddress = getAddress(zeroPadValue("0x1234", 20))
  const tokenValue = 0.1
  const tokenDecimals = 18

  const tokenAddress = getAddress(zeroPadValue("0x5678", 20))
  const etherValue = 0.0

  const transferIface = new Interface(accountAbi)

  const transferCalldata = transferIface.encodeFunctionData("transfer", [
    toAddress,
    parseUnits(tokenValue.toString(), tokenDecimals)
  ])

  const executeIface = new Interface([
    "function execute(address dest, uint256 value, bytes func) external"
  ])

  const executeCalldata = executeIface.encodeFunctionData("execute", [
    tokenAddress,
    parseEther(etherValue.toString()),
    transferCalldata
  ])

  it("should decode the SimpleAccount execute calldata", () => {
    const { to, value, data } = decodeExecuteParams(
      AccountType.SimpleAccount,
      executeCalldata
    )

    expect(to).toBe(tokenAddress)
    expect(value).toBe(parseEther(etherValue.toString()))
    expect(data).toBe(transferCalldata)
  })

  it("should decode the PasskeyAccount execute calldata", () => {
    const { to, value, data } = decodeExecuteParams(
      AccountType.PasskeyAccount,
      executeCalldata
    )

    expect(to).toBe(tokenAddress)
    expect(value).toBe(parseEther(etherValue.toString()))
    expect(data).toBe(transferCalldata)
  })
})
