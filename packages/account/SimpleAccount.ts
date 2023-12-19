import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typings"

import type { Account } from "./index"

export class SimpleAccount implements Account {
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
  public static async initWithSalt(opts: {
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

  private address: HexString
  private owner: ethers.Wallet
  private factory?: SimpleAccountFactory
  private node: ethers.JsonRpcProvider

  private constructor(opts: {
    address: HexString
    owner: ethers.Wallet
    factory?: SimpleAccountFactory
    nodeRpcUrl: string
  }) {
    this.address = opts.address
    this.owner = opts.owner
    this.factory = opts.factory
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
  }

  public async getAddress() {
    return this.address
  }

  public async getInitCode() {
    const isDeployed = await this.isDeployed()
    if (isDeployed) {
      return "0x"
    }
    return this.mustGetFactory().getInitCode()
  }

  public async isDeployed() {
    const code = await this.node.getCode(this.address)
    return code !== "0x"
  }

  public markDeployed() {}

  public async signMessage(message: string | Uint8Array) {
    return this.owner.signMessage(ethers.getBytes(message))
  }

  private mustGetFactory() {
    if (!this.factory) {
      throw new Error("No factory")
    }
    return this.factory
  }
}

class SimpleAccountFactory {
  private factory: ethers.Contract
  private owner: HexString
  private salt: BigNumberish
  private nodeRpcProvider: ethers.JsonRpcProvider

  public constructor(opts: {
    address: string
    owner: HexString
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    this.factory = new ethers.Contract(opts.address, [
      "function getAddress(address owner, uint256 salt) view returns (address)",
      "function createAccount(address owner,uint256 salt)"
    ])
    this.owner = opts.owner
    this.salt = opts.salt
    this.nodeRpcProvider = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
  }

  public async getAddress() {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        await this.nodeRpcProvider.call(
          await this.factory
            .getFunction("getAddress")
            .populateTransaction(this.owner, this.salt)
        )
      ),
      20
    )
  }

  public async getInitCode() {
    const { data } = await this.factory
      .getFunction("createAccount")
      .populateTransaction(this.owner, this.salt)
    return ethers.concat([await this.factory.getAddress(), data])
  }
}
