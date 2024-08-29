import { useEffect, useState } from "react"

import { useStorage } from "~app/storage"
import { NetworkConfig, type NetworkMetadata } from "~config/network"
import { AccountType, type Account as AccountActor } from "~packages/account"
import { type ContractRunner } from "~packages/node"
import { Address } from "~packages/primitive"
import number from "~packages/util/number"
import { AccountStorageManager } from "~storage/local/manager"
import {
  type Account as AccountStorage,
  type AccountToken,
  type Network as NetworkStorage,
  type PasskeyAccount,
  type SimpleAccount
} from "~storage/local/state"

export { useStorage } from "~app/storage"

export const useAction = () => {
  return useStorage(({ state, ...action }) => {
    return action
  })
}

/* Network */

export type Network = NetworkMetadata & NetworkStorage

export const useNetwork = (id?: string): Network => {
  return useStorage(({ state }) => {
    const network = state.network[id ?? state.networkActive]
    return {
      ...NetworkConfig[network.chainId],
      ...state.network[id ?? state.networkActive]
    }
  })
}

export const useNetworks = (): Network[] => {
  return useStorage(({ state }) => {
    return Object.values(state.network).map((n) => {
      return { ...NetworkConfig[n.chainId], ...n }
    })
  })
}

/* Account */

export type Account = Omit<
  | (Omit<SimpleAccount, "address" | "factoryAddress"> & {
      address: Address
      factoryAddress?: Address
    })
  | (Omit<PasskeyAccount, "address" | "factoryAddress" | "publicKey"> & {
      address: Address
      factoryAddress?: Address
      publicKey?: {
        x: bigint
        y: bigint
      }
    }),
  "balance" | "salt"
> & {
  balance: bigint
  salt?: bigint
}

export const useAccount = (id?: string) => {
  const network = useNetwork()
  return useStorage(({ state }) => {
    return projectAccount(state.account[id ?? network.accountActive])
  })
}

export const useAccountWithActor = (runner: ContractRunner, id?: string) => {
  const network = useNetwork()
  const account = useStorage(({ state }) => {
    return state.account[id ?? network.accountActive]
  })
  const [actor, setActor] = useState<AccountActor>(null)

  useEffect(() => {
    async function setupActor() {
      const actor = await AccountStorageManager.wrap(runner, account)
      setActor(actor)
    }
    setupActor()
  }, [account.id])

  return {
    ...account,
    actor,
    actorLoaded: actor !== null
  }
}

export const useAccounts = () => {
  const network = useNetwork()
  return useStorage(({ state }) => {
    return Object.values(state.account)
      .filter((a) => a.chainId === network.chainId)
      .map(projectAccount)
  })
}

export type Token = Omit<AccountToken, "address" | "balance"> & {
  address: Address
  balance: bigint
}

export const useTokens = (accountId?: string): Token[] => {
  const account = useAccount(accountId)
  const network = useNetwork()
  return useStorage(({ state }) => {
    return [
      {
        address: Address.wrap("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"),
        symbol: network.tokenSymbol,
        decimals: 18,
        balance: account.balance
      },
      ...state.account[account.id].tokens.map((t) => ({
        ...t,
        address: Address.wrap(t.address),
        balance: number.toBigInt(t.balance)
      }))
    ]
  })
}

// TODO: What if doing projection in state actor level?
function projectAccount(account: AccountStorage): Account {
  const result = {} as Account
  Object.assign(result, account)
  result.address = Address.wrap(account.address)
  result.balance = number.toBigInt(account.balance)
  if (account.factoryAddress) {
    result.factoryAddress = Address.wrap(account.factoryAddress)
  }
  if (account.salt) {
    result.salt = number.toBigInt(account.salt)
  }
  if (account.type === AccountType.PasskeyAccount) {
    if (account.publicKey) {
      const { x, y } = account.publicKey
      Object.assign(result, {
        publicKey: {
          x: number.toBigInt(x),
          y: number.toBigInt(y)
        }
      })
    }
  }
  return result
}

/* Request */

export const useTransactionLogs = (accountId: string) => {
  return useStorage(({ state }) => {
    return Object.values(state.account[accountId].transactionLog)
  })
}

export const useRequests = () => {
  return useStorage(({ state }) => {
    return Object.values(state.request)
  })
}
