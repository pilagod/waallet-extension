import * as ethers from "ethers"

import type { HexString } from "~typings"

// TODO: Rename to pascal case
import entryPointAbi from "./abi/entryPoint"
import { BundlerMode, BundlerProvider } from "./bundler"
import { Method } from "./rpc"
import { WaalletProvider } from "./waallet"

describe("Waallet Provider", () => {
  const nodeRpcUrl = "http://localhost:8545"
  const nodeRpcProvider = new ethers.JsonRpcProvider(nodeRpcUrl)

  const bundlerRpcUrl = "http://localhost:3000"
  const bundlerProvider = new BundlerProvider(bundlerRpcUrl, BundlerMode.Manual)

  const waalletProvider = new WaalletProvider(nodeRpcUrl, bundlerProvider)

  const entryPoint = new ethers.Contract(
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    entryPointAbi,
    nodeRpcProvider
  )
  const counter = new ethers.Contract(
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    new ethers.Interface([
      "function number() view returns (uint256)",
      "function increment()"
    ]),
    nodeRpcProvider
  )

  it("should pass this canary test", () => {
    expect(true).toBe(true)
  })

  it("should get chain id", async () => {
    const chainId = await waalletProvider.request<HexString>({
      method: Method.eth_chainId
    })
    expect(parseInt(chainId, 16)).toBe(1337)
  })

  it("should get block number", async () => {
    const blockNumber = await waalletProvider.request<HexString>({
      method: Method.eth_blockNumber
    })
    expect(parseInt(blockNumber, 16)).toBeGreaterThan(0)
  })

  it("should estimate gas", async () => {
    const gas = await waalletProvider.request<HexString>({
      method: Method.eth_estimateGas,
      params: [
        {
          from: waalletProvider.account,
          to: waalletProvider.account,
          value: 1
        }
      ]
    })
    expect(parseInt(gas, 16)).toBeGreaterThan(0)
  })

  it("should send transaction to contract", async () => {
    const counterBefore = (await counter.number()) as bigint

    const txHash = await waalletProvider.request<HexString>({
      method: Method.eth_sendTransaction,
      params: [
        {
          from: waalletProvider.account,
          to: await counter.getAddress(),
          input: counter.interface.encodeFunctionData("increment", [])
        }
      ]
    })
    const receipt = await nodeRpcProvider.getTransactionReceipt(txHash)
    expect(receipt.status).toBe(1)

    const counterAfter = (await counter.number()) as bigint
    expect(counterAfter - counterBefore).toBe(1n)
  })
})
