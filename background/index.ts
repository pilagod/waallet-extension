import { JsonRpcProvider } from "ethers"
import browser from "webextension-polyfill"

import { getErc20Contract } from "~packages/network/util"
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
        url: browser.runtime.getURL("popup.html"),
        focused: true,
        type: "popup",
        width: 480,
        height: 720
      })
    },
    { pendingTransaction: {} }
  )

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

  // TODO: In the future, adding an Indexer to the Background Script to
  // monitor Account-related transactions. Updates like balance will trigger
  // as needed, avoiding fixed interval polling with setInterval().
  const fetchAccountBalances = async () => {
    const timeout = 3000
    console.log(`[background] fetch token balance every ${timeout} ms`)

    const { node } = networkManager.getActive()
    const { id: accountId } = await accountManager.getActive()

    const { account } = storage.get()
    const { tokens, balance, address: accountAddress } = account[accountId]

    const provider = new JsonRpcProvider(node.url)

    // Update the balance of native token
    const nativeBalance: bigint = await provider.getBalance(accountAddress)

    if (number.toBigInt(balance) !== nativeBalance) {
      storage.set((state) => {
        state.account[accountId].balance = number.toHex(nativeBalance)
      })
    }

    // Update the balance of all tokens
    for (const t of tokens) {
      try {
        const tokenBalance: bigint = await getErc20Contract(
          t.address,
          provider
        ).balanceOf(accountAddress)

        if (number.toBigInt(t.balance) !== tokenBalance) {
          storage.set((state) => {
            const token = state.account[accountId].tokens.find((token) =>
              address.isEqual(token.address, t.address)
            )
            if (!token) {
              console.warn(`[Popup][tokens] Unknown token: ${t.address}`)
              return
            }
            token.balance = number.toHex(tokenBalance)
          })
        }
      } catch (error) {
        console.warn(
          `[Popup][tokens] error occurred while getting balance: ${error}`
        )
        continue
      }
    }

    setTimeout(fetchAccountBalances, timeout)
  }

  // TODO: Using these two asynchronous functions, both executing
  // `storage.set()` commands, often triggers the error: "Error: Could not
  // establish connection. Receiving end does not exist."
  await indexTransactionSent()
  await fetchAccountBalances()
}

main()
