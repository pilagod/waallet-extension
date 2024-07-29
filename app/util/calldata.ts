import { Interface } from "ethers"

import { AccountType, type Call } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { HexString } from "~typing"

export const decodeExecuteParams = (
  accountType: AccountType,
  calldata: HexString
): Call => {
  switch (accountType) {
    case AccountType.SimpleAccount:
      return SimpleAccount.decode(calldata)
    case AccountType.PasskeyAccount:
      return PasskeyAccount.decode(calldata)
    default:
      throw new Error(`Unknown account type`)
  }
}
