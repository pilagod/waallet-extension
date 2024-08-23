import { JsonRpcProvider } from "ethers"
import browser from "webextension-polyfill"

import { ERC20Contract } from "~packages/contract/erc20"
import { Address } from "~packages/primitive"
import number from "~packages/util/number"
import { getLocalStorage } from "~storage/local"
import { StateActor } from "~storage/local/actor"
import {
  AccountStorageManager,
  NetworkStorageManager
} from "~storage/local/manager"
import { RequestType, TransactionStatus } from "~storage/local/state"
import { getSessionStorage } from "~storage/session"

import { StorageAction } from "./messages/storage"
import { RequestStoragePool } from "./pool"
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
    requestPool: new RequestStoragePool(storage)
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
      const newRequests = patches.filter((p) => p.op === "add")

      if (newRequests.length === 0 || sessionStorage.get().isPopupOpened) {
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
    { request: {} }
  )

  const indexTransactionSent = async () => {
    const timeout = 3000
    console.log(`[background] Sync transactions sent every ${timeout} ms`)

    const state = storage.get()
    const { bundler } = networkManager.getActive()

    const txLogs = Object.values(state.requestLog).filter(
      (r) => r.requestType === RequestType.Transaction
    )
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
      const receipt = {
        userOpHash,
        transactionHash: userOpReceipt.receipt.transactionHash,
        blockHash: userOpReceipt.receipt.blockHash,
        blockNumber: number.toHex(userOpReceipt.receipt.blockNumber)
      }
      storage.set((state) => {
        const stateActor = new StateActor(state)

        if (!userOpReceipt.success) {
          stateActor.transitErc4337TransactionLog(txLog.id, {
            status: TransactionStatus.Reverted,
            receipt: {
              ...receipt,
              errorMessage: userOpReceipt.reason
            }
          })
          return
        }

        stateActor.transitErc4337TransactionLog(txLog.id, {
          status: TransactionStatus.Succeeded,
          receipt
        })
      })
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

    // TODO: Need to obtain the 'from' address for transferring native token and ERC20 tokens

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
        const token = await ERC20Contract.init(t.address, provider)
        const tokenBalance = await token.balanceOf(accountAddress)

        if (number.toBigInt(t.balance) !== tokenBalance) {
          storage.set((state) => {
            const token = state.account[accountId].tokens.find((token) =>
              Address.wrap(token.address).isEqual(t.address)
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
