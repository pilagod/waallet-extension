import { useStorage } from "~app/storage"
import { NetworkConfig, type NetworkMetadata } from "~config/network"
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

export const useAccount = (id?: string) => {
  const network = useNetwork()
  return useStorage(({ state }) => {
    return state.account[id ?? network.accountActive]
  })
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

export const usePendingTransactions = () => {
  return useStorage(({ state }) => {
    return Object.values(state.pendingTransaction)
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
