import * as ethers from "ethers"

import { AccountSkeleton } from "~packages/account/skeleton"
import type { BigNumberish, BytesLike, HexString } from "~typing"

import type { Call } from "../index"
import { PasskeyAccountFactory, type PasskeyPublicKey } from "./factory"
import type { PasskeyOwner } from "./passkeyOwner"

export class PasskeyAccount extends AccountSkeleton<PasskeyAccountFactory> {
  /**
   * Use when account is already deployed
   */
  public static async init(opts: {
    address: HexString
    owner: PasskeyOwner
    nodeRpcUrl: string
  }) {
    const account = new PasskeyAccount({ ...opts })
    opts.owner.use(await account.getCredentialId())
    return account
  }

  /**
   * Use when account is not yet deployed
   */
  public static async initWithFactory(opts: {
    owner: PasskeyOwner
    credentialId: string
    publicKey: PasskeyPublicKey
    salt: BigNumberish
    factoryAddress: string
    nodeRpcUrl: string
  }) {
    opts.owner.use(opts.credentialId)
    const factory = new PasskeyAccountFactory({
      address: opts.factoryAddress,
      credentialId: opts.credentialId,
      publicKey: opts.publicKey,
      salt: opts.salt,
      nodeRpcUrl: opts.nodeRpcUrl
    })
    return new PasskeyAccount({
      address: await factory.getAddress(),
      owner: opts.owner,
      factory,
      nodeRpcUrl: opts.nodeRpcUrl
    })
  }

  private account: ethers.Contract
  private owner: PasskeyOwner

  private constructor(opts: {
    address: HexString
    owner: PasskeyOwner
    factory?: PasskeyAccountFactory
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
        "function passkey() view returns (string credId, uint256 pubKeyX, uint256 pubKeyY)",
        "function getNonce() view returns (uint256)",
        "function execute(address dest, uint256 value, bytes calldata func)"
      ],
      this.node
    )
    this.owner = opts.owner
  }

  public async getCredentialId() {
    const { credId } = await this.account.passkey()
    return credId as string
  }

  public async sign(message: BytesLike, metadata?: any) {
    return this.owner.sign(message, metadata)
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
}
