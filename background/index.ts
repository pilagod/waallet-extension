import browser from "webextension-polyfill"

import number from "~packages/util/number"
import {
  getLocalStorage,
  UserOperationStatus,
  type UserOperationLog,
  type UserOperationReverted,
  type UserOperationSent,
  type UserOperationSucceeded
} from "~storage/local"
import {
  AccountStorageManager,
  NetworkStorageManager
} from "~storage/local/manager"
import { getSessionStorage } from "~storage/session"

import { StorageAction } from "./messages/storage"
import { UserOperationStoragePool } from "./pool"
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
    userOpPool: new UserOperationStoragePool(storage)
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
      const newPendingUserOpLogs = patches.filter((p) => p.op === "add")

      if (
        newPendingUserOpLogs.length === 0 ||
        sessionStorage.get().isPopupOpened
      ) {
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
    { pendingUserOpLog: {} }
  )

  const fetchUserOpsSent = async () => {
    const timeout = 3000
    console.log(`[background] fetch userOp sent every ${timeout} ms`)

    const { account } = storage.get()
    const { bundler } = networkManager.getActive()

    // Fetch all sent user operations from all accounts
    const sentUserOpLogs = Object.values(account)
      .map((a) => a.userOpLog)
      .reduce((result, userOpLog) => {
        return result.concat(Object.values(userOpLog) ?? [])
      }, [] as UserOperationLog[])
      .filter(
        (userOpLog) => userOpLog.status === UserOperationStatus.Sent
      ) as UserOperationSent[]

    // TODO: Custom nonce user operation may block the whole process
    sentUserOpLogs.forEach(async (sentUserOpLog) => {
      const userOpHash = sentUserOpLog.receipt.userOpHash
      const userOpReceipt = await bundler.getUserOperationReceipt(userOpHash)
      if (!userOpReceipt) {
        return
      }

      if (userOpReceipt.success) {
        const succeededUserOpLog: UserOperationSucceeded = {
          ...sentUserOpLog,
          status: UserOperationStatus.Succeeded,
          receipt: {
            userOpHash,
            transactionHash: userOpReceipt.receipt.transactionHash,
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: number.toHex(userOpReceipt.receipt.blockNumber)
          }
        }
        storage.set((state) => {
          state.account[succeededUserOpLog.senderId].userOpLog[
            succeededUserOpLog.id
          ] = succeededUserOpLog
        })
        return
      }

      if (!userOpReceipt.success) {
        const revertedUserOpLog: UserOperationReverted = {
          ...sentUserOpLog,
          status: UserOperationStatus.Reverted,
          receipt: {
            userOpHash,
            transactionHash: userOpReceipt.receipt.transactionHash,
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: number.toHex(userOpReceipt.receipt.blockNumber),
            errorMessage: userOpReceipt.reason
          }
        }
        storage.set((state) => {
          state.account[revertedUserOpLog.senderId].userOpLog[
            revertedUserOpLog.id
          ] = revertedUserOpLog
        })
        return
      }
    })

    setTimeout(fetchUserOpsSent, timeout)
  }

  await fetchUserOpsSent()
}

main()
