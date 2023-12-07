import * as ethers from "ethers"

import type { HexString } from "~typings"

import { BundlerMode, BundlerProvider } from "../../bundler/provider"
import { WaalletRpcMethod } from "../rpc"
import { PrivateKeyAccount } from "./account/privateKey"
import { WaalletBackgroundProvider } from "./provider"

describe("Waallet Background Provider", () => {
  const nodeRpcUrl = "http://localhost:8545"
  const nodeProvider = new ethers.JsonRpcProvider(nodeRpcUrl)

  const bundlerRpcUrl = "http://localhost:3000"
  const bundlerProvider = new BundlerProvider(bundlerRpcUrl, BundlerMode.Manual)

  const waalletProvider = new WaalletBackgroundProvider(
    nodeRpcUrl,
    bundlerProvider
  )
  waalletProvider.connect(
    new PrivateKeyAccount(
      "0x661b4a3909b486a3da520403ecc78f7a7b683c63",
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    )
  )

  const counter = new ethers.Contract(
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    new ethers.Interface([
      "function number() view returns (uint256)",
      "function increment()"
    ]),
    nodeProvider
  )

  it("should get accounts", async () => {
    const accounts = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_accounts
    })
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts[0]).toHaveLength(42)
  })

  it("should request accounts", async () => {
    const accounts = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_requestAccounts
    })
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts[0]).toHaveLength(42)
  })

  it("should get chain id", async () => {
    const chainId = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_chainId
    })
    expect(parseInt(chainId, 16)).toBe(1337)
  })

  it("should get block number", async () => {
    const blockNumber = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_blockNumber
    })
    expect(parseInt(blockNumber, 16)).toBeGreaterThan(0)
  })

  it("should estimate gas", async () => {
    const gas = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_estimateGas,
      params: [
        {
          from: await waalletProvider.account.getAddress(),
          to: await counter.getAddress(),
          data: counter.interface.encodeFunctionData("increment", [])
        }
      ]
    })
    expect(parseInt(gas, 16)).toBeGreaterThan(0)
  })

  it("should send transaction with ether", async () => {
    const balanceBefore = await nodeProvider.getBalance(counter.getAddress())

    const txHash = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          from: await waalletProvider.account.getAddress(),
          to: await counter.getAddress(),
          value: 1
        }
      ]
    })
    const receipt = await nodeProvider.getTransactionReceipt(txHash)
    expect(receipt.status).toBe(1)

    const balanceAfter = await nodeProvider.getBalance(counter.getAddress())
    expect(balanceAfter - balanceBefore).toBe(1n)
  })

  it("should send transaction to contract", async () => {
    const counterBefore = (await counter.number()) as bigint

    const txHash = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          from: await waalletProvider.account.getAddress(),
          to: await counter.getAddress(),
          data: counter.interface.encodeFunctionData("increment", [])
        }
      ]
    })
    const receipt = await nodeProvider.getTransactionReceipt(txHash)
    expect(receipt.status).toBe(1)

    const counterAfter = (await counter.number()) as bigint
    expect(counterAfter - counterBefore).toBe(1n)
  })
})