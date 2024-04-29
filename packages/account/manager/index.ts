import { type Account as AccountContractWrapper } from "~packages/account"

export type Account = {
  id: string
  account: AccountContractWrapper
}

export interface AccountManager {
  get(id: string): Promise<Account>
  getActive(): Promise<Account>
}
