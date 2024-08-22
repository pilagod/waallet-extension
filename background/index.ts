import { JsonRpcProvider } from "ethers"
import { MulticallWrapper } from "ethers-multicall-provider"
import browser from "webextension-polyfill"

import { ERC20Contract } from "~packages/contract/erc20"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { getLocalStorage } from "~storage/local"
import {
  AccountStorageManager,
  NetworkStorageManager
} from "~storage/local/manager"
import {
  TransactionStatus,
  type Account,
  type ERC4337TransactionReverted,
  type ERC4337TransactionSucceeded,
  type Network,
  type TransactionLog
} from "~storage/local/state"
import { getSessionStorage } from "~storage/session"

import { StorageAction } from "./messages/storage"
import { TransactionStoragePool } from "./pool"
import { setupWaalletBackgroundProvider } from "./provider"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

async function main() {
  const storage = await getLocalStorage()
  storage.subscribe(async (_, patches) => {
    // Avoid "Receiving end does not exist" error due to missing app-side addListener.
    try {
      await browser.runtime.sendMessage(browser.runtime.id, {
        action: StorageAction.Sync,
        patches
      })
    } catch (e) {
      console.warn(`An error occurred while receiving end: ${e}`)
    }
  })
  const state = storage.get()
  const network = state.network[state.networkActive]
  if (!network) {
    throw new Error("No available network")
  }
  const networkManager = new NetworkStorageManager(storage)
  const accountManager = new AccountStorageManager(storage, networkManager)
  setupWaalletBackgroundProvider({
    accountManager,
    networkManager,
    transactionPool: new TransactionStoragePool(storage)
  })

  const sessionStorage = await getSessionStorage()
  // TODO: Handle multiple popup case
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === "app") {
      if (!sessionStorage.get().isPopupOpened) {
        sessionStorage.set((draft) => {
          draft.isPopupOpened = true
        })
      }
      const intervalId = setInterval(() => {
        port.postMessage({ action: "ping" })
      }, 3000)
      port.onDisconnect.addListener(() => {
        if (sessionStorage.get().isPopupOpened) {
          sessionStorage.set((draft) => {
            draft.isPopupOpened = false
          })
        }
        clearInterval(intervalId)
      })
    }
  })

  // @dev: Trigger popup when new pending user op is added into the pool.
  storage.subscribe(
    async (_, patches) => {
      const newPendingTxs = patches.filter((p) => p.op === "add")

      if (newPendingTxs.length === 0 || sessionStorage.get().isPopupOpened) {
        return
      }

      await browser.windows.create({
        url: browser.runtime.getURL("tabs/notification.html"),
        focused: true,
        type: "popup",
        width: 480,
        height: 720
      })
    },
    { pendingTransaction: {} }
  )

  const indexBalanceOnBlock = async () => {
    // Track networks already bound to a provider
    const networkIdsBoundForListeningBalance: string[] = []

    // Syncs account balances using multicall
    const updateAccountBalances = async (
      accounts: Account[],
      provider: JsonRpcProvider
    ) => {
      // Use multicall provider to optimize RPC calls
      const multicallProvider = MulticallWrapper.wrap(provider)

      // Store balance update promises
      const tokenQueries = []

      // Update balances for each account
      accounts.forEach((account) => {
        const {
          id,
          tokens,
          chainId,
          balance: accountBalance,
          address: accountAddress
        } = account

        tokenQueries.push(
          (async () => {
            const nativeBalance =
              await multicallProvider.getBalance(accountAddress)

            // Update balance if changed
            if (number.toBigInt(accountBalance) !== nativeBalance) {
              storage.set((state) => {
                state.account[id].balance = number.toHex(nativeBalance)
              })

              console.log(
                `[background][indexBalanceOnBlock] Native token balance updated: ${nativeBalance.toString()} at chain ID: ${chainId}`
              )
            }
          })()
        )

        tokens.forEach(async (t) => {
          tokenQueries.push(
            (async () => {
              const tokenContract = await ERC20Contract.init(
                t.address,
                multicallProvider
              )
              const tokenBalance = await tokenContract.balanceOf(accountAddress)

              // Update token balance if changed
              if (number.toBigInt(t.balance) !== tokenBalance) {
                storage.set((state) => {
                  state.account[id].tokens.find((token) =>
                    address.isEqual(token.address, t.address)
                  ).balance = number.toHex(tokenBalance)
                })

                console.log(
                  `[background][indexBalanceOnBlock] ERC20 token ${
                    t.symbol
                  } balance updated: ${tokenBalance.toString()} at chain ID: ${chainId}`
                )
              }
            })()
          )
        })
      })

      // Execute all balance queries
      await Promise.all(tokenQueries)
    }

    // Handle accountActive state changes and bind providers as needed
    const accountActiveStateSubscriber = async () => {
      // Function to handle block updates using the provider context
      const blockSubscriberWithProvider = async function (
        this: { provider: JsonRpcProvider; network: Network },
        _: number
      ) {
        const { chainId, accountActive } = this.network

        if (!accountActive) {
          return
        }

        const { account } = storage.get()
        const accountsForThisNetwork = Object.values(account).filter(
          (account) => account.chainId === chainId
        )

        await updateAccountBalances(accountsForThisNetwork, this.provider)
      }

      const { network, networkActive } = storage.get()
      const { accountActive } = network[networkActive]

      if (!accountActive) {
        return
      }

      const { account } = storage.get()
      const networks = Object.values(network)
      const accounts = Object.values(account)

      // Get unique chain IDs to prevent duplicate providers
      const uniqueChainIds = Array.from(
        new Set(networks.map((network) => network.chainId))
      )

      // Group accounts by chain ID
      const accountsGroupedByNetwork = uniqueChainIds.map((chainId) =>
        accounts.filter((account) => account.chainId === chainId)
      )

      // Bind provider for each chainId if not already bound
      uniqueChainIds.forEach(async (chainId, i) => {
        if (accountsGroupedByNetwork[i].length === 0) {
          return
        }

        const networkForCurrentChainId = networks.filter(
          (network) => network.chainId === chainId
        )

        const { nodeRpcUrl, id } = networkForCurrentChainId[0]

        if (networkIdsBoundForListeningBalance.includes(id)) {
          return
        }
        networkIdsBoundForListeningBalance.push(id)

        // Set `{ staticNetwork: true }` to avoid infinite retries if nodeRpcUrl fails.
        // Refer: https://github.com/ethers-io/ethers.js/issues/4377
        const provider = new JsonRpcProvider(nodeRpcUrl, chainId, {
          staticNetwork: true
        })

        // First update balances for the local testnet makeup.
        await updateAccountBalances(accountsGroupedByNetwork[i], provider)

        const blockSubscriber = blockSubscriberWithProvider.bind({
          provider,
          network: networkForCurrentChainId[0]
        })

        // Listen for new blocks
        provider.on("block", blockSubscriber)
      })
    }

    const { network } = storage.get()

    // Subscribe to accountActive changes for each network
    Object.values(network).forEach((network) => {
      storage.subscribe(accountActiveStateSubscriber, {
        network: { [network.id]: { accountActive: "" } }
      })
    })

    // First run if the extension is reloaded
    await accountActiveStateSubscriber()
  }

  const indexTransactionSent = async () => {
    const timeout = 3000
    console.log(`[background] Sync transactions sent every ${timeout} ms`)

    const { account } = storage.get()
    const { bundler } = networkManager.getActive()

    // Fetch all sent user operations from all accounts
    const txLogs = Object.values(account)
      .map((a) => a.transactionLog)
      .reduce((result, txLog) => {
        return result.concat(Object.values(txLog) ?? [])
      }, [] as TransactionLog[])

    txLogs.forEach(async (txLog) => {
      if (txLog.status !== TransactionStatus.Sent) {
        return
      }
      // TODO: Handle different version
      const userOpHash = txLog.receipt.userOpHash
      const userOpReceipt = await bundler.getUserOperationReceipt(userOpHash)
      if (!userOpReceipt) {
        return
      }

      if (userOpReceipt.success) {
        const txSucceeded: ERC4337TransactionSucceeded = {
          ...txLog,
          status: TransactionStatus.Succeeded,
          receipt: {
            userOpHash,
            transactionHash: userOpReceipt.receipt.transactionHash,
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: number.toHex(userOpReceipt.receipt.blockNumber)
          }
        }
        storage.set((state) => {
          state.account[txSucceeded.senderId].transactionLog[txSucceeded.id] =
            txSucceeded
        })
        return
      }

      if (!userOpReceipt.success) {
        const txReverted: ERC4337TransactionReverted = {
          ...txLog,
          status: TransactionStatus.Reverted,
          receipt: {
            userOpHash,
            transactionHash: userOpReceipt.receipt.transactionHash,
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: number.toHex(userOpReceipt.receipt.blockNumber),
            errorMessage: userOpReceipt.reason
          }
        }
        storage.set((state) => {
          state.account[txReverted.senderId].transactionLog[txReverted.id] =
            txReverted
        })
        return
      }
    })

    setTimeout(indexTransactionSent, timeout)
  }

  // TODO: Using these two asynchronous functions, both executing
  // `storage.set()` commands, often triggers the error: "Error: Could not
  // establish connection. Receiving end does not exist."
  await indexBalanceOnBlock()
  await indexTransactionSent()
}

main()
