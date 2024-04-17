import { type Account } from "~packages/account"

export interface AccountManager {
  get(id: string): Promise<Account>
  getActive(): Promise<Account>
}
