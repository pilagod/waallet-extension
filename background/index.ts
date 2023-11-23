import { setupWaalletBackgroundProvider } from "./provider"

console.log(
  "Live now; make now always the most precious time. Now will never come again."
)

setupWaalletBackgroundProvider({
  nodeRpcUrl: "http://localhost:8545",
  bundlerRpcUrl: "http://localhost:3000"
})

export {}
