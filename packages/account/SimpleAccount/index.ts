import * as ethers from "ethers"

import type { Call } from "~packages/account"
import { AccountSkeleton } from "~packages/account/skeleton"
import { connect, type ContractRunner } from "~packages/node"
import type { BigNumberish, BytesLike, HexString } from "~typing"

import { SimpleAccountFactory } from "./factory"

export class SimpleAccount extends AccountSkeleton<SimpleAccountFactory> {
  /**
   * Use when account is already deployed
   */
  public static async init(option: {
    address: string
    ownerPrivateKey: string
  }) {
    const owner = new ethers.Wallet(option.ownerPrivateKey)
    return new SimpleAccount({
      address: option.address,
      owner
    })
  }

  /**
   * Use when account is not yet deployed
   */
  public static async initWithFactory(
    runner: ContractRunner,
    option: {
      ownerPrivateKey: string
      factoryAddress: string
      salt: BigNumberish
    }
  ) {
    const owner = new ethers.Wallet(option.ownerPrivateKey)
    const factory = new SimpleAccountFactory({
      address: option.factoryAddress,
      owner: owner.address,
      salt: option.salt
    })
    return new SimpleAccount({
      address: await factory.getAddress(runner),
      owner,
      factory
    })
  }

  private account: ethers.Contract
  private owner: ethers.Wallet

  private constructor(option: {
    address: HexString
    owner: ethers.Wallet
    factory?: SimpleAccountFactory
  }) {
    super({
      address: option.address,
      factory: option.factory
    })
    this.account = new ethers.Contract(option.address, [
      "function execute(address dest, uint256 value, bytes calldata func)"
    ])
    this.owner = option.owner
  }

  public async sign(message: BytesLike) {
    return this.owner.signMessage(ethers.getBytes(message))
  }

  protected async getCallData(call: Call): Promise<HexString> {
    return this.account.interface.encodeFunctionData("execute", [
      call.to,
      call.value ?? 0,
      call.data ?? "0x"
    ])
  }

  protected async getDummySignature(): Promise<HexString> {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
  }
}
