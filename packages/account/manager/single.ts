import { v4 as uuidv4 } from "uuid"

import type { Account } from "~packages/account"
import address from "~packages/util/address"
import type { HexString } from "~typing"

import type { AccountManager } from "./index"

export class SingleAccountManager implements AccountManager {
  private id: string

  public constructor(private account: Account) {
    this.id = uuidv4()
  }

  public async get(id: string) {
    if (id !== this.id) {
      throw new Error(`Unknown account ${id}`)
    }
    return {
      id,
      account: this.account
    }
  }

  public getActive() {
    return this.get(this.id)
  }

  public async getByAddress(accountAddress: HexString) {
    if (!address.isEqual(await this.account.getAddress(), accountAddress)) {
      throw new Error(`Account ${address} is not found`)
    }
    return this.getActive()
  }
}
