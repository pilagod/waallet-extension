import * as ethers from "ethers"

import type { Call } from "~packages/account"
import { AccountType } from "~packages/account"
import { AccountSkeleton } from "~packages/account/skeleton"
import { type ContractRunner } from "~packages/node"
import { Address, type AddressLike } from "~packages/primitive"
import { Bytes } from "~packages/primitive/bytes"
import type { BigNumberish, BytesLike, HexString } from "~typing"

import { SimpleAccountFactory } from "./factory"

export class SimpleAccount extends AccountSkeleton<SimpleAccountFactory> {
  private static abi = [
    "function execute(address dest, uint256 value, bytes calldata func)"
  ]
  /**
   * Use when account is already deployed
   */
  public static async init(
    runner: ContractRunner,
    option: {
      address: AddressLike
      ownerPrivateKey: string
    }
  ) {
    const owner = new ethers.Wallet(option.ownerPrivateKey)
    return new SimpleAccount(runner, {
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
      factory: AddressLike
      salt: BigNumberish
    }
  ) {
    const owner = new ethers.Wallet(option.ownerPrivateKey)
    const factory = new SimpleAccountFactory(runner, {
      address: option.factory,
      owner: owner.address,
      salt: option.salt
    })
    return new SimpleAccount(runner, {
      address: await factory.getAddress(),
      owner,
      factory
    })
  }

  public static decode(calldata: HexString) {
    const [dest, value, func] = new ethers.Interface(
      SimpleAccount.abi
    ).decodeFunctionData("execute", calldata)
    return {
      to: Address.wrap(dest),
      value: value as bigint,
      data: func as HexString
    }
  }

  private account: ethers.Contract
  private owner: ethers.Wallet

  private constructor(
    runner: ContractRunner,
    option: {
      address: AddressLike
      owner: ethers.Wallet
      factory?: SimpleAccountFactory
    }
  ) {
    super(runner, {
      address: option.address,
      factory: option.factory
    })
    this.account = new ethers.Contract(this.address, SimpleAccount.abi)
    this.owner = option.owner
  }

  public dump() {
    return {
      type: AccountType.SimpleAccount as AccountType.SimpleAccount,
      address: this.address,
      ownerPrivateKey: this.owner.privateKey,
      ...(this.factory && {
        factory: this.factory.address,
        salt: this.factory.salt
      })
    }
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

  protected async signRaw(message: BytesLike) {
    const signature = this.owner.signingKey.sign(Bytes.wrap(message))
    return signature.serialized
  }
}
