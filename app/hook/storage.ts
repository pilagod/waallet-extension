import { useEffect, useState } from "react"

import { useStorage } from "~app/storage"
import { NetworkConfig, type NetworkMetadata } from "~config/network"
import { type Account } from "~packages/account"
import { type ContractRunner } from "~packages/node"
import { AccountStorageManager } from "~storage/local/manager"
import { type Network as NetworkStorage } from "~storage/local/state"

export { useStorage } from "~app/storage"

export const useAction = () => {
  return useStorage(({ state, ...action }) => {
    return action
  })
}

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

// TODO: Return account type for application
export const useAccount = (id?: string) => {
  const network = useNetwork()
  return useStorage(({ state }) => {
    return state.account[id ?? network.accountActive]
  })
}

export const useAccountWithActor = (runner: ContractRunner, id?: string) => {
  const account = useAccount(id)
  const [actor, setActor] = useState<Account>(null)
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
    return Object.values(state.account).filter(
      (a) => a.chainId === network.chainId
    )
  })
}

export const useTransactionLogs = (accountId: string) => {
  return useStorage(({ state }) => {
    return Object.values(state.account[accountId].transactionLog)
  })
}

export const usePendingRequests = () => {
  return useStorage(({ state }) => {
    return Object.values(state.pendingRequest)
  })
}

export const useTokens = (accountId?: string) => {
  const account = useAccount(accountId)
  const network = useNetwork()
  return useStorage(({ state }) => {
    return [
      {
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        symbol: network.tokenSymbol,
        decimals: 18,
        balance: account.balance
      },
      ...state.account[account.id].tokens
    ]
  })
}
