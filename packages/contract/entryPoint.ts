import { Contract } from "ethers"

import type { ContractRunner } from "~packages/node"
import type { BigNumberish, HexString } from "~typing"

export type UserOperationEventHandler = (
  userOpHash: HexString,
  sender: HexString,
  paymaster: HexString,
  nonce: BigNumberish,
  success: boolean,
  actualGasCost: BigNumberish,
  actualGasUsed: BigNumberish
) => void | Promise<void>

export class EntryPointContract {
  private static abi = [
    "event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)"
  ]

  public readonly address: HexString
  private entryPoint: Contract
  private handlers: Record<string, UserOperationEventHandler> = {}

  public static async init(address: HexString, runner: ContractRunner) {
    const entryPoint = new Contract(address, EntryPointContract.abi, runner)
    return new EntryPointContract(entryPoint, address)
  }

  private constructor(entryPoint: Contract, address: HexString) {
    this.entryPoint = entryPoint
    this.address = address
  }

  public onUserOperationEvent(
    userOpHash: HexString,
    handler: UserOperationEventHandler
  ) {
    // Remove existing handler if it exists
    const existingHandler = this.handlers[userOpHash]
    if (existingHandler) {
      this.entryPoint.off("UserOperationEvent", existingHandler)
    }

    this.handlers[userOpHash] = handler
    this.entryPoint.on("UserOperationEvent", handler)
  }

  public offUserOperationEvent(userOpHash: HexString) {
    const handler = this.handlers[userOpHash]
    if (handler) {
      this.entryPoint.off("UserOperationEvent", handler)
      delete this.handlers[userOpHash]
    }
  }
}
