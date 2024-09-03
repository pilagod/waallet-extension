import { JsonRpcProvider, type Listener } from "ethers"
import browser from "webextension-polyfill"

import { ERC20Contract } from "~packages/eip/20/contract"
import {
  BundlerMode,
  BundlerProvider
} from "~packages/eip/4337/bundler/provider"
import { Address } from "~packages/primitive"
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
  type Account,
  type RequestLog
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

  const indexBalanceAndTransactionRequestOnBlock = async () => {
    const blockSubscriberContext: {
      provider?: JsonRpcProvider
      blockSubscriber?: Listener
      lastTransactionRequestUpdateTime: number
    } = { lastTransactionRequestUpdateTime: 0 }

    // Syncs account balances
    const updateAccountBalances = async (
      accounts: Account[],
      provider: JsonRpcProvider
    ) => {
      if (accounts.length <= 0) {
        return
      }
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
            nativeToken: 0n,
            erc20Token: {}
          }
        }

        // Query native token balance
        tokenQueries.push(
          (async () => {
            accountBalances[id].nativeToken =
              await provider.getBalance(accountAddress)
          })()
        )

        // Query ERC20 token balances
        tokens.forEach((t) => {
          tokenQueries.push(
            (async () => {
              const tokenContract = ERC20Contract.init(t.address, provider)
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
              (token) => Address.wrap(token.address).isEqual(erc20TokenAddress)
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

    // Syncs transaction requests
    const updateTransactionRequests = async (
      requestLogs: RequestLog[],
      bundler: BundlerProvider
    ) => {
      // Check if 3 seconds have passed since the last execution
      const currentTime = Date.now()
      if (
        currentTime - blockSubscriberContext.lastTransactionRequestUpdateTime <
        3000
      ) {
        console.log(
          `[background][updateTransactionRequests] Skipping execution to respect the 3-second threshold at block.`
        )
        return
      }
      // Update the last execution time
      blockSubscriberContext.lastTransactionRequestUpdateTime = currentTime

      if (requestLogs.length <= 0) {
        return
      }
      // Store updated transaction requests
      const transactionRequests: {
        [requestId: string]: {
          status: TransactionStatus.Succeeded | TransactionStatus.Reverted
          receipt: {
            userOpHash: string
            transactionHash: string
            blockHash: string
            blockNumber: string
            errorMessage: string
          }
        }
      } = {}

      // Process each request log
      for (const requestLog of requestLogs) {
        if (requestLog.status !== TransactionStatus.Sent) {
          continue
        }

        // Initialize transaction request if not present
        if (!transactionRequests[requestLog.id]) {
          transactionRequests[requestLog.id] = {
            status: TransactionStatus.Reverted,
            receipt: {
              userOpHash: "",
              transactionHash: "",
              blockHash: "",
              blockNumber: "",
              errorMessage: ""
            }
          }
        }

        // TODO: Handle different version
        const userOpHash = requestLog.receipt.userOpHash

        const userOpReceipt = await bundler.getUserOperationReceipt(userOpHash)
        if (!userOpReceipt) {
          continue
        }

        transactionRequests[requestLog.id] = {
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
        }
      }

      // Check if transactionRequests is empty and return if so
      if (Object.keys(transactionRequests).length <= 0) {
        return
      }

      // Update stored transaction requests
      storage.set((state) => {
        const stateActor = new StateActor(state)
        for (const transactionId in transactionRequests) {
          const transactionRequest = transactionRequests[transactionId]

          if (transactionRequest.receipt.transactionHash) {
            stateActor.transitErc4337TransactionLog(
              transactionId,
              transactionRequests[transactionId]
            )
          }
        }
      })
    }

    // Handle accountActive state changes and bind providers as needed
    const networkActiveStateSubscriber = async () => {
      // Function to handle block updates using the provider context
      const blockSubscriberWithProvider = async function (this: {
        provider: JsonRpcProvider
        bundler: BundlerProvider
        chainId: number
        networkId: string
      }) {
        // Get the latest accounts
        const { account, requestLog } = storage.get()

        const accountsForThisNetwork = Object.values(account).filter(
          (account) => account.chainId === this.chainId
        )

        const requestLogsForThisNetwork = Object.values(requestLog).filter(
          (r) =>
            r.networkId === this.networkId &&
            r.requestType === RequestType.Transaction
        )

        await updateAccountBalances(accountsForThisNetwork, this.provider)
        await updateTransactionRequests(requestLogsForThisNetwork, this.bundler)
      }

      const { network, networkActive } = storage.get()
      const {
        nodeRpcUrl,
        bundlerRpcUrl,
        entryPoint,
        chainId,
        id: networkId
      } = network[networkActive]

      // Set `{ staticNetwork: true }` to avoid infinite retries if nodeRpcUrl fails.
      // Refer: https://github.com/ethers-io/ethers.js/issues/4377
      const provider = new JsonRpcProvider(nodeRpcUrl, chainId, {
        staticNetwork: true
      })

      const bundler = new BundlerProvider({
        url: bundlerRpcUrl,
        entryPoint: entryPoint,
        mode: chainId === 1337 ? BundlerMode.Manual : BundlerMode.Auto
      })

      const blockSubscriber = blockSubscriberWithProvider.bind({
        provider,
        bundler,
        chainId,
        networkId
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

  await indexBalanceAndTransactionRequestOnBlock()
}

main()
