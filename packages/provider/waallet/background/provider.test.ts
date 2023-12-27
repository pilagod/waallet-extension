import * as ethers from "ethers"

import config from "~config/test"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { HexString } from "~typing"

import { WaalletRpcMethod } from "../rpc"
import { WaalletBackgroundProvider } from "./provider"

describe("WaalletBackgroundProvider", () => {
  const { node } = config.provider
  const { counter } = config.contract

  const waalletProvider = new WaalletBackgroundProvider(
    config.rpc.node,
    config.provider.bundler
  )

  beforeAll(async () => {
    waalletProvider.connect(
      await SimpleAccount.init({
        address: config.address.SimpleAccount,
        ownerPrivateKey: config.account.operator.privateKey,
        nodeRpcUrl: config.rpc.node
      })
    )
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

  it("should estimate gas", async () => {
    const gas = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_estimateGas,
      params: [
        {
          from: await waalletProvider.account.getAddress(),
          to: await counter.getAddress(),
          value: 1,
          data: counter.interface.encodeFunctionData("increment", [])
        }
      ]
    })
    expect(parseInt(gas, 16)).toBeGreaterThan(0)
  })

  it("should send transaction to contract", async () => {
    const balanceBefore = await node.getBalance(counter.getAddress())
    const counterBefore = (await counter.number()) as bigint

    const txHash = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          from: await waalletProvider.account.getAddress(),
          to: await counter.getAddress(),
          value: 1,
          data: counter.interface.encodeFunctionData("increment", [])
        }
      ]
    })
    const receipt = await node.getTransactionReceipt(txHash)
    expect(receipt.status).toBe(1)

    const balanceAfter = await node.getBalance(counter.getAddress())
    expect(balanceAfter - balanceBefore).toBe(1n)

    const counterAfter = (await counter.number()) as bigint
    expect(counterAfter - counterBefore).toBe(1n)
  })
})
