import { JsonRpcProvider } from "ethers"
import browser from "webextension-polyfill"

import { BundlerRpcMethod } from "~packages/bundler/rpc"
import { EntryPointContract } from "~packages/contract/entryPoint"
import { ERC20Contract } from "~packages/contract/erc20"
import { JsonRpcProvider as WaalletJsonRpcProvider } from "~packages/rpc/json/provider"
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
import type { BigNumberish, HexString } from "~typing"

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
  const indexBalanceContext: {
    provider?: JsonRpcProvider
    blockSubscriber?: (blockNumber: number) => Promise<void>
  } = {}

  const indexBalanceOnBlock = async () => {
    // Subscriber function that handles network changes
    const networkActiveAndAccountSubscriber = async (state: State) => {
      console.log(
        `[background][listenAccountBalance] Network or account changed`
      )

      // Remove previous subscription if exists
      if (indexBalanceContext.provider && indexBalanceContext.blockSubscriber) {
        indexBalanceContext.provider.off(
          "block",
          indexBalanceContext.blockSubscriber
        )
      }

      const { account, network, networkActive } = state

      // Set `{ staticNetwork: true }` to avoid infinite retries if nodeRpcUrl fails.
      // Refer: https://github.com/ethers-io/ethers.js/issues/4377
      indexBalanceContext.provider = new JsonRpcProvider(
        network[networkActive].nodeRpcUrl,
        network[networkActive].chainId,
        { staticNetwork: true }
      )

      // Define a new block subscriber
      indexBalanceContext.blockSubscriber = async (blockNumber) => {
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

        console.log(
          `[background][listenAccountBalance] Chain id: ${chainId}, New block mined: ${blockNumber}`
        )

        const nativeBalance =
          await indexBalanceContext.provider.getBalance(accountAddress)

        // Update the account balance if it has changed
        if (number.toBigInt(accountBalance) !== nativeBalance) {
          storage.set((state) => {
            state.account[id].balance = number.toHex(nativeBalance)
          })
        }

        // Update token balance if it has changed
        tokens.forEach(async (t) => {
          const tokenContract = await ERC20Contract.init(
            t.address,
            indexBalanceContext.provider
          )
          const tokenBalance = await tokenContract.balanceOf(accountAddress)

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
      indexBalanceContext.provider.on(
        "block",
        indexBalanceContext.blockSubscriber
      )
    }

    // Subscribe to networkActive changes
    storage.subscribe(networkActiveAndAccountSubscriber, {
      networkActive: ""
    })
    // Subscribe to account changes
    storage.subscribe(networkActiveAndAccountSubscriber, {
      account: {}
    })
  }

  // Create a context to hold providers, bundlers, and entry point contracts for each network
  const indexTransactionContext: Record<
    string,
    {
      provider?: JsonRpcProvider
      bundler?: WaalletJsonRpcProvider
      entryPoint?: EntryPointContract
    }
  > = {}

  // Synchronize user operation receipts based on transaction logs
  const syncUserOpReceipt = async (txLog: TransactionLog) => {
    const networkId = txLog.networkId

    if (
      !indexTransactionContext[networkId] ||
      txLog.status !== TransactionStatus.Sent
    ) {
      return
    }

    const userOpHash = txLog.receipt.userOpHash
    const { entryPoint, bundler } = indexTransactionContext[networkId]

    if (!entryPoint.isListening(userOpHash)) {
      return
    }

    // Fetch the user operation receipt from the bundler
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

    // Update the transaction log if the user operation was successful
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

      // Remove the event handler once the operation is processed
      entryPoint.offUserOperationEvent(txLog.receipt.userOpHash)
    }

    // Update the transaction log if the user operation was reverted
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

      // Remove the event handler once the operation is processed
      entryPoint.offUserOperationEvent(txLog.receipt.userOpHash)
    }
  }

  // Set up event listeners for user operations and handle state changes
  const indexTransactionOnEvent = async () => {
    // Subscriber function that processes state changes and handles user operations
    const accountSubscriber = async (state: State) => {
      console.log(`[background][indexTransactionOnEvent] Account changed`)

      const { account, network } = state

      // Fetch all sent user operations from all accounts
      const txLogs = Object.values(account)
        .map((a) => a.transactionLog)
        .reduce((result, txLog) => {
          return result.concat(Object.values(txLog) ?? [])
        }, [] as TransactionLog[])

      // Iterate over each transaction log to process sent operations
      txLogs.forEach(async (txLog) => {
        if (txLog.status !== TransactionStatus.Sent) {
          return
        }
        const networkId = txLog.networkId
        const entryPoint = txLog.detail.entryPoint
        const { nodeRpcUrl, bundlerRpcUrl } = network[networkId]

        // Initialize context for the network if not already done
        if (!indexTransactionContext[networkId]) {
          const provider = new JsonRpcProvider(nodeRpcUrl)

          indexTransactionContext[networkId] = {
            provider,
            bundler: new WaalletJsonRpcProvider(bundlerRpcUrl),
            entryPoint: await EntryPointContract.init(entryPoint, provider)
          }
        }

        // Handler to process user operation events
        const userOpEventHandler = async (userOpHash: HexString) => {
          if (userOpHash !== txLog.receipt.userOpHash) {
            return
          }

          console.log(
            `[background][indexTransactionOnEvent] Chain id: ${
              network[txLog.networkId].chainId
            }, Account name: ${
              account[txLog.senderId].name
            }, userOp is on-chain: ${txLog.receipt.userOpHash}`
          )
          syncUserOpReceipt(txLog)
        }

        // Register the event handler if the network context is initialized
        if (indexTransactionContext[txLog.networkId]) {
          indexTransactionContext[
            txLog.networkId
          ].entryPoint.onUserOperationEvent(
            txLog.receipt.userOpHash,
            userOpEventHandler
          )
        }
      })
    }

    // Subscribe to state changes and process the initial state
    storage.subscribe(accountSubscriber, {
      account: {}
    })
  }

  await indexBalanceOnBlock()
  await indexTransactionOnEvent()
}

main()
