import { useShallow } from "zustand/react/shallow"

import { useStorage } from "~app/storage"

export { useStorage } from "~app/storage"

export const useAction = () => {
  return useStorage(
    useShallow(({ state, ...action }) => {
      return action
    })
  )
}

export const useNetwork = (id?: string) => {
  return useStorage(
    useShallow(({ state }) => {
      const networkId = id ?? state.networkActive
      return {
        id: networkId,
        ...state.network[networkId]
      }
    })
  )
}

export const useNetworks = () => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.entries(state.network).map(([id, n]) => ({
        id,
        ...n
      }))
    })
  )
}

export const useShouldOnboard = () => {
  return useStorage(
    useShallow(({ state }) => {
      const network = useNetwork()
      return (
        Object.values(state.account).filter(
          (a) => a.chainId === network.chainId
        ).length === 0
      )
    })
  )
}

export const useAccount = (id?: string) => {
  return useStorage(
    useShallow(({ state }) => {
      const network = useNetwork()
      const accountId = id ?? network.accountActive
      return {
        id: accountId,
        ...state.account[accountId]
      }
    })
  )
}

export const useAccounts = () => {
  return useStorage(
    useShallow(({ state }) => {
      const network = useNetwork()
      return Object.entries(state.account)
        .filter(([_, a]) => a.chainId === network.chainId)
        .map(([id, a]) => {
          return { id, ...a }
        })
    })
  )
}

export const useTransactionLogs = (accountId: string) => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.account[accountId].transactionLog)
    })
  )
}

export const usePendingTransactions = () => {
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.pendingTransaction)
    })
  )
}

export const useTokens = (accountId?: string) => {
  return useStorage(
    useShallow(({ state }) => {
      const account = useAccount(accountId)
      return state.account[account.id].tokens
    })
  )
}
