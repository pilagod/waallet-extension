import * as ethers from "ethers"

import number from "~packages/utils/number"
import type { BigNumberish, HexString } from "~typings"

import type { Account, Call } from "./index"

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

  private node: ethers.JsonRpcProvider

  private account: ethers.Contract
  private owner: ethers.Wallet
  private factory?: SimpleAccountFactory

  private constructor(opts: {
    address: HexString
    owner: ethers.Wallet
    factory?: SimpleAccountFactory
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.account = new ethers.Contract(
      opts.address,
      [
        "function getNonce() view returns (uint256)",
        "function execute(address dest, uint256 value, bytes calldata func)"
      ],
      this.node
    )
    this.owner = opts.owner
    this.factory = opts.factory
  }

  public async createUserOperationCall(call?: Call) {
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
      "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

    return {
      sender,
      nonce: number.toHex(nonce),
      initCode,
      callData,
      signature: dummySignature
    }
  }

  public async getAddress() {
    return this.account.getAddress()
  }

  public async isDeployed() {
    return !!(await this.account.getDeployedCode())
  }

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
  private node: ethers.JsonRpcProvider

  private factory: ethers.Contract
  private owner: HexString
  private salt: BigNumberish

  public constructor(opts: {
    address: string
    owner: HexString
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.factory = new ethers.Contract(
      opts.address,
      [
        "function getAddress(address owner, uint256 salt) view returns (address)",
        "function createAccount(address owner,uint256 salt)"
      ],
      this.node
    )
    this.owner = opts.owner
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