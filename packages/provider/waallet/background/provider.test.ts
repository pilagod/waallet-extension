import * as ethers from "ethers"

import config from "~config/test"
import { SimpleAccountFactoryAdapter } from "~packages/account/adapter/SimpleAccountFactory"
import { EoaOwnedAccount } from "~packages/account/eoa"
import number from "~packages/utils/number"
import type { HexString } from "~typings"

import { WaalletRpcMethod } from "../rpc"
import { WaalletBackgroundProvider } from "./provider"

describe("Waallet Background Provider", () => {
  const { node } = config.provider
  const { counter } = config.contract

  const waalletProvider = new WaalletBackgroundProvider(
    config.rpc.node,
    config.provider.bundler
  )

  beforeEach(async () => {
    waalletProvider.connect(
      await EoaOwnedAccount.initWithAddress({
        address: config.address.SimpleAccount,
        ownerPrivateKey: config.account.operator.privateKey
      })
    )
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
    const balanceBefore = await node.getBalance(counter.getAddress())

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
    const receipt = await node.getTransactionReceipt(txHash)
    expect(receipt.status).toBe(1)

    const balanceAfter = await node.getBalance(counter.getAddress())
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
    const receipt = await node.getTransactionReceipt(txHash)
    expect(receipt.status).toBe(1)

    const counterAfter = (await counter.number()) as bigint
    expect(counterAfter - counterBefore).toBe(1n)
  })

  it("should deploy account and send transaction when account is not deployed", async () => {
    const account = await EoaOwnedAccount.initWithSalt({
      factoryAdapter: new SimpleAccountFactoryAdapter(
        config.address.SimpleAccountFactory,
        config.rpc.node
      ),
      salt: number.random(),
      ownerPrivateKey: config.account.operator.privateKey
    })
    await config.account.operator.sendTransaction({
      to: await account.getAddress(),
      value: ethers.parseUnits("0.001", "ether")
    })
    waalletProvider.connect(account)

    const codeBefore = await node.getCode(await account.getAddress())
    expect(codeBefore).toBe("0x")
    expect(await account.isDeployed()).toBe(false)

    const counterBefore = (await counter.number()) as bigint

    await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          from: await waalletProvider.account.getAddress(),
          to: await counter.getAddress(),
          data: counter.interface.encodeFunctionData("increment", [])
        }
      ]
    })

    const codeAfter = await node.getCode(await account.getAddress())
    expect(codeAfter).not.toBe("0x")
    expect(await account.isDeployed()).toBe(true)

    const counterAfter = (await counter.number()) as bigint
    expect(counterAfter - counterBefore).toBe(1n)
  })
})
