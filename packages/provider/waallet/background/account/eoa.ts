import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typings"

import { type Account } from "./index"

export interface EoaOwnedAccountFactoryAdapter {
  getAddress(ownerAddress: HexString, salt: BigNumberish): Promise<HexString>
  getInitCode(ownerAddress: HexString, salt: BigNumberish): Promise<HexString>
}

export class EoaOwnedAccount implements Account {
  public static async initWithAddress(opts: {
    accountAddress: HexString
    ownerPrivateKey: HexString
  }): Promise<EoaOwnedAccount> {
    return new EoaOwnedAccount(opts)
  }

  public static async initWithSalt(opts: {
    ownerPrivateKey: HexString
    factoryAdapter: EoaOwnedAccountFactoryAdapter
    salt: BigNumberish
  }): Promise<EoaOwnedAccount> {
    const owner = new ethers.Wallet(opts.ownerPrivateKey)
    const accountAddress = await opts.factoryAdapter.getAddress(
      owner.address,
      opts.salt
    )
    return new EoaOwnedAccount({
      accountAddress,
      ...opts
    })
  }

  private accountAddress: HexString
  private owner: ethers.Wallet

  private factoryAdapter?: EoaOwnedAccountFactoryAdapter
  private salt?: BigNumberish

  private constructor(opts: {
    accountAddress: HexString
    ownerPrivateKey: HexString
    factoryAdapter?: EoaOwnedAccountFactoryAdapter
    salt?: BigNumberish
  }) {
    this.accountAddress = opts.accountAddress
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
    if (opts.factoryAdapter) {
      this.factoryAdapter = opts.factoryAdapter
    }
    if (opts.salt) {
      this.salt = opts.salt
    }
  }

  public async getAddress() {
    return this.accountAddress
  }

  public async getInitCode() {
    if (!this.factoryAdapter || !this.salt) {
      throw new Error("Factory adapter or salt is not set")
    }
    return this.factoryAdapter.getInitCode(this.owner.address, this.salt)
  }

  public signMessage(message: string | Uint8Array) {
    return this.owner.signMessage(ethers.getBytes(message))
  }
}
