import { getBytes, Wallet } from "ethers"

import type { HexString } from "~typings"

import { type Account } from "./index"

export class EoaOwnedAccount implements Account {
  private accountOwner: Wallet

  public constructor(
    private accountAddress: HexString,
    ownerPrivateKey: HexString
  ) {
    this.accountOwner = new Wallet(ownerPrivateKey)
  }

  public getAddress() {
    return Promise.resolve(this.accountAddress)
  }

  public signMessage(message: string | Uint8Array) {
    return this.accountOwner.signMessage(getBytes(message))
  }
}
