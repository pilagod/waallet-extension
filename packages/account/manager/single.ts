import { v4 as uuidv4 } from "uuid"

import type { Account } from "~packages/account"

import type { AccountManager } from "./index"

export class SingleAccountManager implements AccountManager {
  private id: string

  public constructor(private account: Account) {
    this.id = uuidv4()
  }

  public async get(id: string): Promise<Account> {
    if (id !== this.id) {
      throw new Error(`Unknown account ${id}`)
    }
    return this.account
  }

  public getActive(): Promise<Account> {
    return this.get(this.id)
  }
}
