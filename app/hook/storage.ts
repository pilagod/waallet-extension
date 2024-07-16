import { useShallow } from "zustand/react/shallow"

import { useStorage } from "~app/storage"

export { useStorage } from "~app/storage"

export const useAction = () => {
  return useStorage(({ state, ...action }) => {
    return action
  })
}

export const useNetwork = (id?: string) => {
  return useStorage(({ state }) => {
    return state.network[id ?? state.networkActive]
  })
}

export const useNetworks = () => {
  return useStorage(({ state }) => {
    return Object.values(state.network)
  })
}

export const useAccount = (id?: string) => {
  const network = useNetwork()
  return useStorage(({ state }) => {
    return state.account[id ?? network.accountActive]
  })
}

export const useAccountCount = (networkId?: string) => {
  const network = useNetwork(networkId)
  return useStorage(
    useShallow(({ state }) => {
      return Object.values(state.account).filter(
        (a) => a.chainId === network.chainId
      ).length
    })
  )
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
  return useStorage(({ state }) => {
    return state.account[account.id].tokens
  })
}
