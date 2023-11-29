import { getBytes, Wallet } from "ethers"

import type { HexString } from "~typings"

import { type Account } from "./index"

export class PrivateKeyAccount implements Account {
  private accountOwner: Wallet

  public constructor(
    private accountAddress: HexString,
    accountOwnerPrivateKey: HexString
  ) {
    this.accountOwner = new Wallet(accountOwnerPrivateKey)
  }

  public getAddress() {
    return Promise.resolve(this.accountAddress)
  }

  public signMessage(message: string | Uint8Array) {
    return this.accountOwner.signMessage(getBytes(message))
  }
}
