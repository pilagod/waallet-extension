import { JsonRpcProvider, type Listener } from "ethers"
import { MulticallWrapper } from "ethers-multicall-provider"
import browser from "webextension-polyfill"

import { ERC20Contract } from "~packages/contract/erc20"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { getLocalStorage } from "~storage/local"
import { StateActor } from "~storage/local/actor"
import {
  AccountStorageManager,
  NetworkStorageManager
} from "~storage/local/manager"
import {
  RequestType,
  TransactionStatus,
  type Account
} from "~storage/local/state"
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

  const indexBalanceOnBlock = async () => {
    const blockSubscriberContext: {
      provider?: JsonRpcProvider
      blockSubscriber?: Listener
    } = {}

    // Syncs account balances using multicall
    const updateAccountBalances = async (
      accounts: Account[],
      provider: JsonRpcProvider
    ) => {
      // Use multicall provider to optimize RPC calls
      const multicallProvider = MulticallWrapper.wrap(provider)

      // Store balance update promises
      const tokenQueries = []
      // Store updated balances
      const accountBalances: {
        [accountId: string]: {
          nativeToken: bigint
          erc20Token: { [address: string]: bigint }
        }
      } = {}

      // Store balances for each account
      accounts.forEach((account) => {
        const { id, tokens, address: accountAddress } = account

        // Initialize balances if not present
        if (!accountBalances[id]) {
          accountBalances[id] = {
            nativeToken: BigInt(0),
            erc20Token: {}
          }
        }

        // Query native token balance
        tokenQueries.push(
          (async () => {
            accountBalances[id].nativeToken =
              await multicallProvider.getBalance(accountAddress)
          })()
        )

        // Query ERC20 token balances
        tokens.forEach((t) => {
          tokenQueries.push(
            (async () => {
              const tokenContract = ERC20Contract.init(
                t.address,
                multicallProvider
              )
              accountBalances[id].erc20Token[t.address] =
                await tokenContract.balanceOf(accountAddress)
            })()
          )
        })
      })

      // Execute all balance queries
      try {
        await Promise.all(tokenQueries)
      } catch (error) {
        console.error(
          `[background][indexBalanceOnBlock] Error executing token balance updates: ${error}`
        )
      }

      // Update balances in storage
      storage.set((state) => {
        for (const accountId in accountBalances) {
          const balances = accountBalances[accountId]
          const nativeTokenBalance = balances.nativeToken

          // Update native token balance
          if (
            number.toBigInt(state.account[accountId].balance) !==
            nativeTokenBalance
          ) {
            state.account[accountId].balance = number.toHex(nativeTokenBalance)

            console.log(
              `[background][indexBalanceOnBlock] Native token balance updated`
            )
          }

          const erc20TokenBalances = balances.erc20Token

          // Update ERC20 token balances
          for (const erc20TokenAddress in erc20TokenBalances) {
            const erc20TokenBalance = erc20TokenBalances[erc20TokenAddress]
            const erc20TokenState = state.account[accountId].tokens.find(
              (token) => address.isEqual(token.address, erc20TokenAddress)
            )

            if (
              number.toBigInt(erc20TokenState.balance) !== erc20TokenBalance
            ) {
              erc20TokenState.balance = number.toHex(erc20TokenBalance)

              console.log(
                `[background][indexBalanceOnBlock] ERC20 token balance updated`
              )
            }
          }
        }
      })
    }

    // Handle accountActive state changes and bind providers as needed
    const networkActiveStateSubscriber = async () => {
      // Function to handle block updates using the provider context
      const blockSubscriberWithProvider = async function (this: {
        provider: JsonRpcProvider
        chainId: number
      }) {
        // Get the latest accounts
        const { account } = storage.get()

        const accountsForThisNetwork = Object.values(account).filter(
          (account) => account.chainId === this.chainId
        )
        if (accountsForThisNetwork.length <= 0) {
          return
        }

        await updateAccountBalances(accountsForThisNetwork, this.provider)
      }

      const { network, networkActive } = storage.get()
      const networkInstance = network[networkActive]
      const { nodeRpcUrl, chainId } = networkInstance

      // Set `{ staticNetwork: true }` to avoid infinite retries if nodeRpcUrl fails.
      // Refer: https://github.com/ethers-io/ethers.js/issues/4377
      const provider = new JsonRpcProvider(nodeRpcUrl, chainId, {
        staticNetwork: true
      })

      const blockSubscriber = blockSubscriberWithProvider.bind({
        provider,
        chainId
      })

      // Update provider and subscriber on network switch
      if (
        blockSubscriberContext.provider &&
        blockSubscriberContext.blockSubscriber
      ) {
        blockSubscriberContext.provider.off(
          "block",
          blockSubscriberContext.blockSubscriber
        )
      }

      blockSubscriberContext.provider = provider
      blockSubscriberContext.blockSubscriber = blockSubscriber

      // Listen for new blocks
      blockSubscriberContext.provider.on("block", blockSubscriber)
      console.log(
        `[background][indexBalanceOnBlock] Provider listening for blocks on chainId: ${chainId}`
      )

      // First update balances for the local testnet makeup.
      await blockSubscriber()
    }

    storage.subscribe(networkActiveStateSubscriber, {
      networkActive: ""
    })

    // First run if the extension is reloaded
    await networkActiveStateSubscriber()
  }

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
      storage.set((state) => {
        new StateActor(state).transitErc4337TransactionLog(txLog.id, {
          status: userOpReceipt.success
            ? TransactionStatus.Succeeded
            : TransactionStatus.Reverted,
          receipt: {
            userOpHash,
            transactionHash: userOpReceipt.receipt.transactionHash,
            blockHash: userOpReceipt.receipt.blockHash,
            blockNumber: number.toHex(userOpReceipt.receipt.blockNumber),
            errorMessage: userOpReceipt.reason
          }
        })
      })
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
