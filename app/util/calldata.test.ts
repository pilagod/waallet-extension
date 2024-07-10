import {
  getAddress,
  Interface,
  parseEther,
  parseUnits,
  zeroPadValue
} from "ethers"

import { decodeExecuteParams, decodeTransferParams } from "~app/util/calldata"

describe("calldata", () => {
  const toAddress = getAddress(zeroPadValue("0x1234", 20))
  const tokenValue = 0.1
  const tokenDecimals = 18

  const tokenAddress = getAddress(zeroPadValue("0x5678", 20))
  const etherValue = 0.0

  const transferIface = new Interface([
    "function transfer(address to, uint256 value) public returns (bool)"
  ])

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

  it("should decode the token transfer calldata", () => {
    const { to, value } = decodeTransferParams(transferCalldata)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })

  it("should decode the execute calldata", () => {
    const { dest, value, func } = decodeExecuteParams(executeCalldata)

    expect(dest).toBe(tokenAddress)
    expect(value).toBe(parseEther(etherValue.toString()))
    expect(func).toBe(transferCalldata)
  })

  it("should decode the transfer calldata from execute calldata", () => {
    const { func } = decodeExecuteParams(executeCalldata)
    const { to, value } = decodeTransferParams(func)

    expect(to).toBe(toAddress)
    expect(value).toBe(parseUnits(tokenValue.toString(), tokenDecimals))
  })
})
