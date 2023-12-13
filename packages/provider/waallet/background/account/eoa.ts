import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typings"

import { type Account } from "./index"

export interface EoaOwnedAccountFactoryAdapter {
  getAddress(owner: HexString, salt: BigNumberish): Promise<HexString>
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
      ownerPrivateKey: opts.ownerPrivateKey,
      accountAddress
    })
  }

  private accountAddress: HexString
  private owner: ethers.Wallet

  private constructor(opts: {
    accountAddress: HexString
    ownerPrivateKey: HexString
  }) {
    this.accountAddress = opts.accountAddress
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
  }

  public async getAddress() {
    return this.accountAddress
  }

  public signMessage(message: string | Uint8Array) {
    return this.owner.signMessage(ethers.getBytes(message))
  }
}
