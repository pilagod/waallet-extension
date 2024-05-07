import browser from "webextension-polyfill"

import {
  UserOperationStatus,
  type UserOperationLog
} from "~background/storage/local"
import { UserOperation } from "~packages/bundler"
import { BundlerRpcMethod } from "~packages/bundler/rpc"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

import { AccountStorageManager, NetworkStorageManager } from "./manager"
import { UserOperationStoragePool } from "./pool"
import { setupWaalletBackgroundProvider } from "./provider"
// TODO: Rename to local storage
import { getStorage } from "./storage/local"
import { getSessionStorage } from "./storage/session"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

async function main() {
  const storage = await getStorage()
  const state = storage.get()
  const network = state.network[state.networkActive]
  if (!network) {
    throw new Error("No available network")
  }
  const account = state.account[network.accountActive]
  if (!account) {
    throw new Error("No available account")
  }
  const accountManager = new AccountStorageManager(storage)
  const networkManager = new NetworkStorageManager(storage)
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
      const newPendingUserOpLogs = patches.filter(
        (p) =>
          p.op === "add" &&
          (p.value as UserOperationLog).status === UserOperationStatus.Pending
      )
      if (newPendingUserOpLogs.length === 0) {
        return
      }
      if (sessionStorage.get().isPopupOpened) {
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
    ["userOpPool"]
  )

  const fetchUserOpsSent = async () => {
    const timeout = 1500
    console.log(`[background] fetch userOp sent every ${timeout} ms`)

    const s = storage.get()
    const nm = new NetworkStorageManager(storage)

    const chainId = nm.getActive().chainId
    const bundler = nm.getActive().bundler

    const userOps = Object.values(s.userOpPool)
    const sentUserOps = userOps.filter(
      (userOp) => userOp.status === UserOperationStatus.Sent
    )

    sentUserOps.forEach(async (sentUserOp) => {
      const id = sentUserOp.id
      const userOp = new UserOperation(sentUserOp.userOp)
      const userOpHash = userOp.hash(sentUserOp.entryPointAddress, chainId)
      await bundler.wait(userOpHash)

      const userOpReceipt = await bundler.getUserOperationReceipt(userOpHash)

      if (!userOpReceipt) {
        return
      }

      if (userOpReceipt.success) {
        const succeededUserOp: UserOperationLog = {
          ...sentUserOp,
          status: UserOperationStatus.Succeeded,
          receipt: {
            userOpHash: userOpHash,
            transactionHash: userOpReceipt.receipt.transactionHash,
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: number.toHex(userOpReceipt.receipt.blockNumber)
          }
        }
        storage.set((state) => {
          state.userOpPool[id] = succeededUserOp
        })
        return
      }

      if (!userOpReceipt.success) {
        const failedUserOp: UserOperationLog = {
          ...sentUserOp,
          status: UserOperationStatus.Failed,
          receipt: {
            userOpHash: userOpHash,
            transactionHash: userOpReceipt.receipt.transactionHash,
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: number.toHex(userOpReceipt.receipt.blockNumber),
            errorMessage: userOpReceipt.reason
          }
        }
        storage.set((state) => {
          state.userOpPool[id] = failedUserOp
        })
        return
      }
    })

    setTimeout(fetchUserOpsSent, timeout)
  }

  await fetchUserOpsSent()
}

main()
