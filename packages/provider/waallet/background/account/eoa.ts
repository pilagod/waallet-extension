import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typings"

import { type Account } from "./index"

export interface EoaOwnedAccountFactoryAdapter {
  getAddress(owner: HexString, salt: BigNumberish): Promise<HexString>
}

export class EoaOwnedAccount implements Account {
  private owner: ethers.Wallet

  private accountAddress?: HexString

  private factoryAdapter?: EoaOwnedAccountFactoryAdapter
  private salt?: BigNumberish

  public constructor(opts: {
    ownerPrivateKey: HexString
    accountAddress: HexString
  })
  public constructor(opts: {
    ownerPrivateKey: HexString
    factoryAdapter: EoaOwnedAccountFactoryAdapter
    salt: BigNumberish
  })
  public constructor(
    opts:
      | {
          ownerPrivateKey: HexString
          accountAddress: HexString
        }
      | {
          ownerPrivateKey: HexString
          factoryAdapter: EoaOwnedAccountFactoryAdapter
          salt: BigNumberish
        }
  ) {
    if ("accountAddress" in opts) {
      this.accountAddress = opts.accountAddress
    }
    if ("factoryAdapter" in opts) {
      this.factoryAdapter = opts.factoryAdapter
      this.salt = opts.salt
    }
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
  }

  public async getAddress() {
    if (!this.accountAddress) {
      this.accountAddress = await this.factoryAdapter.getAddress(
        this.owner.address,
        this.salt
      )
    }
    return this.accountAddress
  }

  public signMessage(message: string | Uint8Array) {
    return this.owner.signMessage(ethers.getBytes(message))
  }
}
