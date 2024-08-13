import * as ethers from "ethers"

import type { Call } from "~packages/account"
import { AccountSkeleton } from "~packages/account/skeleton"
import { type ContractRunner } from "~packages/node"
import { Bytes } from "~packages/primitive/bytes"
import type { BigNumberish, BytesLike, HexString } from "~typing"

import { SimpleAccountFactory } from "./factory"

export class SimpleAccount extends AccountSkeleton<SimpleAccountFactory> {
  /**
   * Use when account is already deployed
   */
  public static async init(
    runner: ContractRunner,
    option: {
      address: string
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
      factoryAddress: string
      salt: BigNumberish
    }
  ) {
    const owner = new ethers.Wallet(option.ownerPrivateKey)
    const factory = new SimpleAccountFactory(runner, {
      address: option.factoryAddress,
      owner: owner.address,
      salt: option.salt
    })
    return new SimpleAccount(runner, {
      address: await factory.getAddress(),
      owner,
      factory
    })
  }

  private account: ethers.Contract
  private owner: ethers.Wallet
  private static abi: string[] = [
    "function execute(address dest, uint256 value, bytes calldata func)"
  ]

  private constructor(
    runner: ContractRunner,
    option: {
      address: HexString
      owner: ethers.Wallet
      factory?: SimpleAccountFactory
    }
  ) {
    super(runner, {
      address: option.address,
      factory: option.factory
    })
    this.account = new ethers.Contract(option.address, SimpleAccount.abi)
    this.owner = option.owner
  }

  public static decode(calldata: HexString): Call {
    const [dest, value, func] = new ethers.Interface(
      SimpleAccount.abi
    ).decodeFunctionData("execute", calldata)
    return { to: dest, value, data: func }
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
