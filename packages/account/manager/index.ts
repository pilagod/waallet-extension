import { type Account as AccountInstance } from "~packages/account"
import type { HexString } from "~typing"

export type Account = {
  id: string
  account: AccountInstance
}

export interface AccountManager {
  get(id: string): Promise<Account>
  getActive(): Promise<Account>
  getByAddress(address: HexString, chainId: number): Promise<Account>
}
