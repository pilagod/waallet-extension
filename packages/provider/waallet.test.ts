import { Method } from "./rpc"
import { WaalletProvider } from "./waallet"

describe("Waallet Provider", () => {
  const nodeRpcUrl = "http://localhost:8545"
  const bundlerRpcUrl = "http://localhost:3000"
  const waalletProvider = new WaalletProvider(nodeRpcUrl, bundlerRpcUrl)

  it("should pass this canary test", () => {
    expect(true).toBe(true)
  })

  it("should get chain id", async () => {
    const chainId = await waalletProvider.request({
      method: Method.eth_chainId
    })
    expect(parseInt(chainId, 16)).toBe(1337)
  })

  it("should get block number", async () => {
    const blockNumber = await waalletProvider.request({
      method: Method.eth_blockNumber
    })
    expect(parseInt(blockNumber, 16)).toBeGreaterThan(0)
  })

  it("should estimate gas", async () => {
    const gas = await waalletProvider.request({
      method: Method.eth_estimateGas,
      params: [
        {
          from: waalletProvider.account,
          to: waalletProvider.account,
          value: 1,
          gas: 50000,
          gasPrice: 1
        }
      ]
    })
    expect(parseInt(gas, 16)).toBeGreaterThan(0)
  })
})
