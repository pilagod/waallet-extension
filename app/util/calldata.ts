import { Interface } from "ethers"

import type { HexString } from "~typing"

export type ExecuteParam = {
  dest: HexString
  value: bigint
  func: HexString
}

export const decodeExecuteParams = (calldata: HexString): ExecuteParam => {
  const executeAbi = [
    "function execute(address dest, uint256 value, bytes func) external"
  ]
  const executeIface = new Interface(executeAbi)
  const { dest, value, func } = executeIface.decodeFunctionData(
    "execute",
    calldata
  )
  return { dest, value, func }
}

export type TransferParam = {
  to: HexString
  value: bigint
}

export const decodeTransferParams = (calldata: HexString): TransferParam => {
  const transferAbi = [
    "function transfer(address to, uint256 value) public returns (bool)"
  ]
  const transferIface = new Interface(transferAbi)
  const { to, value } = transferIface.decodeFunctionData("transfer", calldata)
  return { to, value }
}
