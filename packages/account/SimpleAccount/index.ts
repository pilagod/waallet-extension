import * as ethers from "ethers"

import type { Call } from "~packages/account"
import { AccountSkeleton } from "~packages/account/skeleton"
import type { BigNumberish, HexString } from "~typing"

import { SimpleAccountFactory } from "./factory"

export class SimpleAccount extends AccountSkeleton<SimpleAccountFactory> {
  /**
   * Use when account is already deployed
   */
  public static async init(opts: {
    address: string
    ownerPrivateKey: string
    nodeRpcUrl: string
  }) {
    const owner = new ethers.Wallet(opts.ownerPrivateKey)
    return new SimpleAccount({
      address: opts.address,
      owner,
      nodeRpcUrl: opts.nodeRpcUrl
    })
  }

  /**
   * Use when account is not yet deployed
   */
  public static async initWithFactory(opts: {
    ownerPrivateKey: string
    factoryAddress: string
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    const owner = new ethers.Wallet(opts.ownerPrivateKey)
    const factory = new SimpleAccountFactory({
      address: opts.factoryAddress,
      owner: owner.address,
      salt: opts.salt,
      nodeRpcUrl: opts.nodeRpcUrl
    })
    return new SimpleAccount({
      address: await factory.getAddress(),
      owner,
      factory,
      nodeRpcUrl: opts.nodeRpcUrl
    })
  }

  private account: ethers.Contract
  private owner: ethers.Wallet

  private constructor(opts: {
    address: HexString
    owner: ethers.Wallet
    factory?: SimpleAccountFactory
    nodeRpcUrl: string
  }) {
    super({
      address: opts.address,
      factory: opts.factory,
      nodeRpcUrl: opts.nodeRpcUrl
    })
    this.account = new ethers.Contract(
      opts.address,
      [
        "function getNonce() view returns (uint256)",
        "function execute(address dest, uint256 value, bytes calldata func)"
      ],
      this.node
    )
    this.owner = opts.owner
  }

  public async sign(message: string | Uint8Array) {
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

  protected async getNonce(): Promise<BigNumberish> {
    const nonce = (await this.account.getNonce()) as bigint
    return nonce
  }
}
