import { JsonRpcProvider } from "ethers"
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
  type ERC4337TransactionReverted,
  type ERC4337TransactionSucceeded,
  type State,
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

  // networkContext to hold the current provider and block subscriber
  const networkContext: {
    provider?: JsonRpcProvider
    blockSubscriber?: (blockNumber: number) => Promise<void>
  } = {}

  const listenAccountBalance = async () => {
    // Subscriber function that handles network changes
    const networkActiveSubscriber = async (state: State) => {
      console.log(
        `[background][listenAccountBalance] Network or account changed`
      )

      // Remove previous subscription if exists
      if (networkContext.provider && networkContext.blockSubscriber) {
        networkContext.provider.off("block", networkContext.blockSubscriber)
      }

      const { account, network, networkActive } = state

      // Return early if the account is not exist
      if (!network[networkActive].accountActive) {
        return
      }

      const {
        id,
        tokens,
        chainId,
        balance: accountBalance,
        address: accountAddress
      } = account[network[networkActive].accountActive]

      // Create a new provider instance with the updated RPC URL
      networkContext.provider = new JsonRpcProvider(
        network[networkActive].nodeRpcUrl
      )

      // Define a new block subscriber function
      networkContext.blockSubscriber = async (blockNumber) => {
        console.log(
          `[background][listenAccountBalance] Chain id: ${chainId}, New block mined: ${blockNumber}`
        )

        const nativeBalance =
          await networkContext.provider.getBalance(accountAddress)

        // Update the account balance if it has changed
        if (number.toBigInt(accountBalance) !== nativeBalance) {
          storage.set((state) => {
            state.account[id].balance = number.toHex(nativeBalance)
          })
        }

        tokens.map(async (t) => {
          const tokenContract = await ERC20Contract.init(
            t.address,
            networkContext.provider
          )
          const tokenBalance = await tokenContract.balanceOf(accountAddress)

          // Update token balance if it has changed
          if (number.toBigInt(t.balance) !== tokenBalance) {
            storage.set((state) => {
              state.account[id].tokens.find((token) =>
                address.isEqual(token.address, t.address)
              ).balance = number.toHex(tokenBalance)
            })
          }
        })
      }

      // Subscribe to new blocks using the updated block subscriber function
      networkContext.provider.on("block", networkContext.blockSubscriber)
    }

    // Subscribe to networkActive changes
    storage.subscribe(networkActiveSubscriber, {
      networkActive: ""
    })
    // Subscribe to account changes
    storage.subscribe(networkActiveSubscriber, {
      account: {}
    })
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
  await listenAccountBalance()
  await indexTransactionSent()
}

main()
