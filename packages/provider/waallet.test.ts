import rpc from "./rpc"
import { WaalletProvider } from "./waallet"

describe("Waallet Provider", () => {
  const waalletProvider = new WaalletProvider("http://localhost:3000")

  it("should pass this canary test", () => {
    expect(true).toBe(true)
  })

  it("should get chain id from bundler", async () => {
    const chainId = await waalletProvider.request({
      method: rpc.method.ethChainId
    })
    expect(parseInt(chainId, 16)).toBe(31337)
  })
})
