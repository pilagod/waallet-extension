import { type Account as AccountInstance } from "~packages/account"
import { Address } from "~packages/primitive"

export type Account = {
  id: string
  account: AccountInstance
}

export interface AccountManager {
  get(id: string): Promise<Account>
  getActive(): Promise<Account>
  getByAddress(address: Address, chainId: number): Promise<Account>
}
