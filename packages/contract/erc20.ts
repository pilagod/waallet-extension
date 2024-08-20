import { Contract, Interface, parseUnits, toNumber } from "ethers"

import type { ContractRunner } from "~packages/node"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export class ERC20Contract {
  private static abi = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 value) public returns (bool)",
    "function transferFrom(address from, address to, uint256 value) public returns (bool)",
    "function name() public view returns (string)",
    "function symbol() public view returns (string)",
    "function decimals() public view returns (uint8)"
  ]

  public readonly address: HexString
  private token: Contract

  public static encodeTransferData(to: HexString, value: BigNumberish) {
    const iface = new Interface(ERC20Contract.abi)
    return iface.encodeFunctionData("transfer", [to, value])
  }

  public static encodeTransferFromData(
    from: HexString,
    to: HexString,
    value: BigNumberish
  ) {
    const iface = new Interface(ERC20Contract.abi)
    return iface.encodeFunctionData("transferFrom", [from, to, value])
  }

  public static decodeTransferParam(calldata: HexString): {
    to: HexString
    value: bigint
  } {
    const [to, value] = new Interface(ERC20Contract.abi).decodeFunctionData(
      "transfer",
      calldata
    )
    return { to, value: number.toBigInt(value) }
  }

  public static decodeTransferFromParam(calldata: HexString): {
    from: HexString
    to: HexString
    value: bigint
  } {
    const [from, to, value] = new Interface(
      ERC20Contract.abi
    ).decodeFunctionData("transferFrom", calldata)
    return { from, to, value: number.toBigInt(value) }
  }

  public static async init(address: HexString, runner: ContractRunner) {
    const token = new Contract(address, ERC20Contract.abi, runner)
    return new ERC20Contract(token, address)
  }

  private constructor(token: Contract, address: HexString) {
    this.token = token
    this.address = address
  }

  public async name(): Promise<string> {
    return await this.token.name()
  }

  public async symbol(): Promise<string> {
    return await this.token.symbol()
  }

  public async decimals(): Promise<number> {
    return toNumber(await this.token.decimals())
  }

  public async balanceOf(account: HexString): Promise<bigint> {
    return number.toBigInt(await this.token.balanceOf(account))
  }

  public async parseAmount(amount: BigNumberish): Promise<bigint> {
    return parseUnits(number.toString(amount), await this.decimals())
  }
}
