import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typings"

import { type Account } from "./index"

// TODO: Extract a generic adapter interface
export interface EoaOwnedAccountFactoryAdapter {
  getAddress(ownerAddress: HexString, salt: BigNumberish): Promise<HexString>
  getInitCode(ownerAddress: HexString, salt: BigNumberish): Promise<HexString>
}

export class EoaOwnedAccount implements Account {
  /**
   * Use when account is already deployed
   */
  public static async initWithAddress(opts: {
    address: HexString
    ownerPrivateKey: HexString
  }): Promise<EoaOwnedAccount> {
    return new EoaOwnedAccount({
      ...opts,
      deployed: true
    })
  }

  /**
   * Use when account is not yet deployed
   */
  public static async initWithSalt(opts: {
    factoryAdapter: EoaOwnedAccountFactoryAdapter
    salt: BigNumberish
    ownerPrivateKey: HexString
  }): Promise<EoaOwnedAccount> {
    const owner = new ethers.Wallet(opts.ownerPrivateKey)
    const address = await opts.factoryAdapter.getAddress(
      owner.address,
      opts.salt
    )
    const initCode = await opts.factoryAdapter.getInitCode(
      owner.address,
      opts.salt
    )
    return new EoaOwnedAccount({
      address,
      deployed: false,
      ownerPrivateKey: owner.privateKey,
      initCode
    })
  }

  private address: HexString
  private deployed: boolean
  private initCode: HexString = "0x"

  private owner: ethers.Wallet

  private constructor(opts: {
    address: HexString
    deployed: boolean
    ownerPrivateKey: HexString
    initCode?: HexString
  }) {
    this.address = opts.address
    this.deployed = opts.deployed
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
    if (opts.initCode) {
      this.initCode = opts.initCode
    }
  }

  public async getAddress() {
    return this.address
  }

  public async getInitCode() {
    if (await this.isDeployed()) {
      return "0x"
    }
    if (!this.initCode) {
      throw new Error("No init code for account")
    }
    return this.initCode
  }

  public async isDeployed() {
    return this.deployed
  }

  public markDeployed() {
    this.deployed = true
  }

  public signMessage(message: string | Uint8Array) {
    return this.owner.signMessage(ethers.getBytes(message))
  }
}
