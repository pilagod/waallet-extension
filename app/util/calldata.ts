import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { HexString } from "~typing"

export const decodeExecuteParams = (
  accountType: AccountType,
  callData: HexString
) => {
  switch (accountType) {
    case AccountType.SimpleAccount:
      return SimpleAccount.decode(callData)
    case AccountType.PasskeyAccount:
      return PasskeyAccount.decode(callData)
    default:
      throw new Error(`Unknown account type`)
  }
}
