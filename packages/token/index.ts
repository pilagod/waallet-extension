import { Contract, Interface } from "ethers"

import type { ContractRunner } from "~packages/node"
import type { BigNumberish, HexString } from "~typing"

export type TransferParam =
  | {
      from: HexString
      to: HexString
      value: BigNumberish
    }
  | { to: HexString; value: BigNumberish }

export class Token {
  private static abi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 value) public returns (bool)",
    "function transferFrom(address from, address to, uint256 value) public returns (bool)",
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "function decimals() public view returns (uint8)"
  ]

  public constructor(
    public readonly address: HexString,
    public readonly symbol: string,
    public readonly decimals: number
  ) {}

  public static contractCreation = (
    address: HexString,
    runner: ContractRunner
  ) => {
    return new Contract(address, Token.abi, runner)
  }

  public static decodeTransferParam(calldata: HexString): TransferParam {
    const methodId = calldata.slice(0, 10)
    const iface = new Interface(Token.abi)
    if (!iface.hasFunction(methodId)) {
      throw new Error(`Unknown function selector: ${methodId}`)
    }

    if (methodId === iface.getFunction("transfer").selector) {
      const [to, value] = iface.decodeFunctionData("transfer", calldata)
      return { to, value }
    }

    if (methodId === iface.getFunction("transferFrom").selector) {
      const [from, to, value] = iface.decodeFunctionData(
        "transferFrom",
        calldata
      )
      return { from, to, value }
    }
  }
}

// TODO: Network specific
export const ETH = new Token(
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  "ETH",
  18
)
