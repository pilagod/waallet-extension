import browser from "webextension-polyfill"

import {
  UserOperationStatus,
  type UserOperationStatement
} from "~background/storage"
import { UserOperation } from "~packages/bundler"
import { BundlerRpcMethod } from "~packages/bundler/rpc"
import { JsonRpcProvider } from "~packages/rpc/json/provider"
import json from "~packages/util/json"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

import { AccountStorageManager, NetworkStorageManager } from "./manager"
import { UserOperationStoragePool } from "./pool"
import { setupWaalletBackgroundProvider } from "./provider"
// TODO: Rename to local storage
import { getStorage } from "./storage"
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

  const fetchData = async () => {
    const fetchUserOpsSent = async () => {
      const timeout = 1500
      console.log(`[background] fetch userOp sent every ${timeout} ms`)

      const s = storage.get()
      const nm = new NetworkStorageManager(storage)

      const chainId = nm.getActive().chainId
      const bundler = nm.getActive().bundler

      const userOps = Object.values(s.userOpPool)
      const sentUserOps = userOps.filter((userOp) => userOp.status === "Sent")

      sentUserOps.forEach(async (sentUserOp) => {
        const id = sentUserOp.id
        const userOp = new UserOperation(sentUserOp.userOp)
        const userOpHash = userOp.hash(sentUserOp.entryPointAddress, chainId)
        await bundler.wait(userOpHash)

        const userOpReceipt = await bundler.send<{
          success: boolean
          reason: string
          receipt: {
            transactionHash: HexString
            blockHash: HexString
            blockNumber: BigNumberish
          }
        }>({
          method: BundlerRpcMethod.eth_getUserOperationReceipt,
          params: [userOpHash]
        })

        if (userOpReceipt && userOpReceipt.success) {
          const succeededUserOp: UserOperationStatement = {
            ...sentUserOp,
            status: UserOperationStatus.Succeeded,
            receipt: {
              userOpHash: userOpHash,
              transactionHash: userOpReceipt.receipt.transactionHash,
              blockHash: userOpReceipt.receipt.blockHash,
              blockNumber: number.toHex(userOpReceipt.receipt.blockNumber)
            }
          }
          const state = { userOpPool: { [id]: succeededUserOp } }
          storage.set(state, { override: false })
        }

        if (userOpReceipt && !userOpReceipt.success) {
          const succeededUserOp: UserOperationStatement = {
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
          const state = { userOpPool: { [id]: succeededUserOp } }
          storage.set(state, { override: false })
        }
      })

      setTimeout(fetchUserOpsSent, timeout)
    }
    // First call
    await fetchUserOpsSent()
  }

  await fetchData()
}

main()
