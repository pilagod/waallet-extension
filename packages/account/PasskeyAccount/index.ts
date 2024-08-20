import * as ethers from "ethers"

import { AccountType } from "~packages/account"
import { AccountSkeleton } from "~packages/account/skeleton"
import type { ContractRunner } from "~packages/node"
import { Address, type AddressLike } from "~packages/primitive"
import { Bytes } from "~packages/primitive/bytes"
import number from "~packages/util/number"
import type { BigNumberish, BytesLike, HexString } from "~typing"

import type { Call } from "../index"
import { PasskeyAccountFactory } from "./factory"
import type { PasskeyOwner } from "./passkeyOwner"

export class PasskeyAccount extends AccountSkeleton<PasskeyAccountFactory> {
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
      owner: PasskeyOwner
    }
  ) {
    return new PasskeyAccount(runner, { ...option })
  }

  /**
   * Use when account is not yet deployed
   */
  public static async initWithFactory(
    runner: ContractRunner,
    option: {
      owner: PasskeyOwner
      salt: BigNumberish
      factory: AddressLike
    }
  ) {
    const factory = new PasskeyAccountFactory(runner, {
      address: option.factory,
      credentialId: option.owner.getCredentialId(),
      publicKey: option.owner.getPublicKey(),
      salt: option.salt
    })
    return new PasskeyAccount(runner, {
      address: await factory.getAddress(),
      owner: option.owner,
      factory
    })
  }

  public static decode(calldata: HexString) {
    const [dest, value, func] = new ethers.Interface(
      PasskeyAccount.abi
    ).decodeFunctionData("execute", calldata)
    return {
      to: Address.wrap(dest),
      value: value as bigint,
      data: func as HexString
    }
  }

  /**
   * Get credential id from PasskeyAccount contract.
   */
  public static async getCredentialId(
    runner: ContractRunner,
    address: AddressLike
  ) {
    const account = new ethers.Contract(
      Address.wrap(address),
      [
        "function passkey() view returns (string credId, uint256 pubKeyX, uint256 pubKeyY)"
      ],
      runner
    )
    const { credId } = await account.passkey()
    return credId as string
  }

  private account: ethers.Contract
  private owner: PasskeyOwner

  private constructor(
    runner: ContractRunner,
    option: {
      address: AddressLike
      owner: PasskeyOwner
      factory?: PasskeyAccountFactory
    }
  ) {
    super(runner, {
      address: option.address,
      factory: option.factory
    })
    this.account = new ethers.Contract(this.address, PasskeyAccount.abi)
    this.owner = option.owner
  }

  public dump() {
    const { x, y } = this.owner.getPublicKey()
    return {
      type: AccountType.PasskeyAccount as AccountType.PasskeyAccount,
      address: this.address.unwrap(),
      credentialId: this.owner.getCredentialId(),
      publicKey: {
        x: number.toHex(x),
        y: number.toHex(y)
      },
      ...(this.factory && {
        factoryAddress: this.factory.address.unwrap(),
        salt: number.toHex(this.factory.salt)
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
    return "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000150e9e8c7d5a5cfa26f5edf2d5643190c9978c72737bd2cf40d5cd053ac00d57501a5dad3af5fe8af6fe0b5868fc95d31ad760f3b6f2be52fb66aee4a92405ae000000000000000000000000000000000000000000000000000000000000000254fb20856f24a6ae7dafc2781090ac8477ae6e2bd072660236cc614c6fb7c2ea0050000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000667b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22222c226f726967696e223a2268747470733a2f2f776562617574686e2e70617373776f72646c6573732e6964222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000000000"
  }

  protected async signRaw(message: BytesLike) {
    const {
      authenticatorData,
      clientDataJson,
      signature: { r, s }
    } = await this.owner.sign(message)

    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "bool",
        "bytes",
        "bool",
        "string",
        "uint256",
        "uint256",
        "uint256",
        "uint256"
      ],
      [
        false,
        Bytes.wrap(authenticatorData),
        true,
        clientDataJson,
        23, // clientDataJsonChallengeIndex
        1, // clientDataJsonTypeIndex
        r,
        s
      ]
    )

    return signature
  }
}
