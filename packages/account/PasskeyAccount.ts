import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typing"

import type { Account, Call } from "./index"
import type { PasskeyOwner } from "./PasskeyOwner"

export type PasskeyPublicKey = {
  x: BigNumberish
  y: BigNumberish
}

export class PasskeyAccount implements Account {
  public static async init(opts: {
    address: HexString
    owner: PasskeyOwner
    nodeRpcUrl: string
  }) {
    const account = new PasskeyAccount({ ...opts })
    opts.owner.set(await account.getCredentialId())
    return account
  }

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
      [`function passkey() view returns (${Passkey} passkey)`],
      this.node
    )
    this.owner = opts.owner
    this.factory = opts.factory
  }

  public async createUserOperationCall(call: Call) {
    return {} as any
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
    return ""
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
