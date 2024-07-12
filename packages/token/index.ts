import { Contract, Interface } from "ethers"

import type { ContractRunner } from "~packages/node"
import type { BigNumberish, HexString } from "~typing"

export type Token = {
  address: HexString
  symbol: string
  decimals: number
}

export const ETH: Token = {
  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  symbol: "ETH",
  decimals: 18
}

export class TokenContract {
  public readonly address: HexString
  public name: string
  public symbol: string
  public decimals: BigNumberish

  private token: Contract
  private static abi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 value) public returns (bool)",
    "function transferFrom(address from, address to, uint256 value) public returns (bool)",
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "function decimals() public view returns (uint8)"
  ]

  public static async init(address: HexString, runner: ContractRunner) {
    const token = new Contract(address, TokenContract.abi, runner)
    return new TokenContract(
      token,
      address,
      await token.name(),
      await token.symbol(),
      await token.decimals()
    )
  }

  private constructor(
    token: Contract,
    address: HexString,
    name: string,
    symbol: string,
    decimals: number
  ) {
    this.token = token
    this.address = address
    this.name = name
    this.symbol = symbol
    this.decimals = decimals
  }

  public async balanceOf(account: HexString): Promise<BigNumberish> {
    return await this.token.balanceOf(account)
  }

  public static encodeTransferData(to: HexString, value: BigNumberish) {
    const iface = new Interface(TokenContract.abi)
    return iface.encodeFunctionData("transfer", [to, value])
  }

  public static encodeTransferFromData(
    from: HexString,
    to: HexString,
    value: BigNumberish
  ) {
    const iface = new Interface(TokenContract.abi)
    return iface.encodeFunctionData("transferFrom", [from, to, value])
  }

  public static decodeTransferParam(calldata: HexString): {
    to: HexString
    value: BigNumberish
  } {
    const [to, value] = new Interface(TokenContract.abi).decodeFunctionData(
      "transfer",
      calldata
    )
    return { to, value }
  }

  public static decodeTransferFromParam(calldata: HexString): {
    from: HexString
    to: HexString
    value: BigNumberish
  } {
    const [from, to, value] = new Interface(
      TokenContract.abi
    ).decodeFunctionData("transferFrom", calldata)
    return { from, to, value }
  }
}
