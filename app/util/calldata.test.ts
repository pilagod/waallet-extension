import {
  getAddress,
  Interface,
  parseEther,
  parseUnits,
  zeroPadValue
} from "ethers"

import { decodeExecuteParams, decodeTransferParams } from "~app/util/calldata"
import { AccountType } from "~packages/account"

const transferIface = new Interface([
  "function transfer(address to, uint256 value) public returns (bool)"
])

const executeIface = new Interface([
  "function execute(address dest, uint256 value, bytes func) external"
])

describe("calldata", () => {
  it("should decode the token transfer calldata", () => {
    const toAddress = getAddress(zeroPadValue("0x1234", 20))
    const tokenValue = 0.1
    const tokenDecimals = 18

    const transferCalldata = transferIface.encodeFunctionData("transfer", [
      toAddress,
      parseUnits(tokenValue.toString(), tokenDecimals)
    ])

    const { to, value } = decodeTransferParams(transferCalldata)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })

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

    expect(to.unwrap()).toBe(tokenAddress)
    expect(value).toBe(parseEther(etherValue.toString()))
    expect(data).toBe(transferCalldata)
  })

  it("should decode the transfer calldata from execute calldata", () => {
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

    const { data } = decodeExecuteParams(accountType, executeCalldata)
    const { to, value } = decodeTransferParams(data)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })
})
