import { AccountStorageManager, NetworkStorageManager } from "./manager"
import { setupWaalletBackgroundProvider } from "./provider"
import { getStorage, type Account } from "./storage"

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
    networkManager
  })
}

main()
