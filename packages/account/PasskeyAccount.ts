import * as ethers from "ethers"

import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

import type { Account, Call } from "./index"
import type { PasskeyOwner } from "./PasskeyOwner"

export type PasskeyPublicKey = {
  x: BigNumberish
  y: BigNumberish
}

export class PasskeyAccount implements Account {
  /**
   * Use when account is already deployed
   */
  public static async init(opts: {
    address: HexString
    owner: PasskeyOwner
    nodeRpcUrl: string
  }) {
    const account = new PasskeyAccount({ ...opts })
    opts.owner.set(await account.getCredentialId())
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
    opts.owner.set(opts.credentialId)
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

  private node: ethers.JsonRpcProvider

  private account: ethers.Contract
  private owner: PasskeyOwner
  private factory?: PasskeyAccountFactory

  private constructor(opts: {
    address: HexString
    owner: PasskeyOwner
    factory?: PasskeyAccountFactory
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    const Passkey = "(string credId, uint256 pubKeyX, uint256 pubKeyY)"
    this.account = new ethers.Contract(
      opts.address,
      [
        `function passkey() view returns (${Passkey} passkey)`,
        "function getNonce() view returns (uint256)",
        "function execute(address dest, uint256 value, bytes calldata func)"
      ],
      this.node
    )
    this.owner = opts.owner
    this.factory = opts.factory
  }

  public async createUserOperationCall(call: Call) {
    const isDeployed = await this.isDeployed()

    const sender = await this.account.getAddress()
    const nonce =
      call?.nonce ?? (isDeployed ? await this.account.getNonce() : 0)
    const initCode = isDeployed
      ? "0x"
      : await this.mustGetFactory().getInitCode()
    const callData = call
      ? this.account.interface.encodeFunctionData("execute", [
          call.to,
          number.toHex(call.value ?? 0),
          call.data ?? "0x"
        ])
      : "0x"
    const dummySignature =
      "0x00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000017000000000000000000000000000000000000000000000000000000000000000150e9e8c7d5a5cfa26f5edf2d5643190c9978c72737bd2cf40d5cd053ac00d57501a5dad3af5fe8af6fe0b5868fc95d31ad760f3b6f2be52fb66aee4a92405ae000000000000000000000000000000000000000000000000000000000000000254fb20856f24a6ae7dafc2781090ac8477ae6e2bd072660236cc614c6fb7c2ea0050000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000667b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22222c226f726967696e223a2268747470733a2f2f776562617574686e2e70617373776f72646c6573732e6964222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000000000"

    return {
      sender,
      nonce: number.toHex(nonce),
      initCode,
      callData,
      signature: dummySignature
    }
  }

  public async getCredentialId() {
    const { credId } = await this.account.passkey()
    return credId as string
  }

  public async getAddress() {
    return this.account.getAddress()
  }

  public async isDeployed() {
    return !!(await this.account.getDeployedCode())
  }

  public async signMessage(message: string | Uint8Array) {
    return this.owner.sign(message)
  }

  private mustGetFactory() {
    if (!this.factory) {
      throw new Error("No factory")
    }
    return this.factory
  }
}

class PasskeyAccountFactory {
  private node: ethers.JsonRpcProvider

  private factory: ethers.Contract
  private credentialId: string
  private publicKey: PasskeyPublicKey
  private salt: BigNumberish

  public constructor(opts: {
    address: HexString
    credentialId: string
    publicKey: PasskeyPublicKey
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.factory = new ethers.Contract(
      opts.address,
      [
        "function getAddress(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt) view returns (address)",
        "function createAccount(string credId, uint256 pubKeyX, uint256 pubKeyY, uint256 salt)"
      ],
      this.node
    )
    this.credentialId = opts.credentialId
    this.publicKey = opts.publicKey
    this.salt = opts.salt
  }

  public async getAddress() {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        // The name of `getAddress` conflicts with the function on ethers.Contract.
        // So we build call data from interface and directly send through node rpc provider.
        await this.node.call(
          await this.factory
            .getFunction("getAddress")
            .populateTransaction(
              this.credentialId,
              this.publicKey.x,
              this.publicKey.y,
              this.salt
            )
        )
      ),
      20
    )
  }

  public async getInitCode() {
    const { data } = await this.factory
      .getFunction("createAccount")
      .populateTransaction(
        this.credentialId,
        this.publicKey.x,
        this.publicKey.y,
        this.salt
      )
    return ethers.concat([await this.factory.getAddress(), data])
  }
}
