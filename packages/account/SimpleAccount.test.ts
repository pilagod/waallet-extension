import * as ethers from "ethers"

import config from "~config/test"
import number from "~packages/number"
import { WaalletBackgroundProvider } from "~packages/provider/waallet/background/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"
import type { HexString } from "~typing"

import { SimpleAccount } from "./SimpleAccount"

describe("SimpleAccount", () => {
  const { node } = config.provider
  const { counter } = config.contract

  // TODO: Extract a setup util for account testing
  const waalletProvider = new WaalletBackgroundProvider(
    config.rpc.node,
    config.provider.bundler
  )
  const owner = config.account.operator
  let account: SimpleAccount

  beforeAll(async () => {
    account = await SimpleAccount.initWithFactory({
      ownerPrivateKey: owner.privateKey,
      factoryAddress: config.address.SimpleAccountFactory,
      salt: number.random(),
      nodeRpcUrl: config.rpc.node
    })
    waalletProvider.connect(account)
    await (
      await owner.sendTransaction({
        to: await account.getAddress(),
        value: ethers.parseEther("1")
      })
    ).wait()
  })

  it("should get accounts", async () => {
    const accounts = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_accounts
    })
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts[0]).toBe(await account.getAddress())
  })

  it("should request accounts", async () => {
    const accounts = await waalletProvider.request<HexString>({
      method: WaalletRpcMethod.eth_requestAccounts
    })
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts[0]).toBe(await account.getAddress())
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

    await waalletProvider.request<HexString>({
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

    const balanceAfter = await node.getBalance(counter.getAddress())
    expect(balanceAfter - balanceBefore).toBe(1n)

    const counterAfter = (await counter.number()) as bigint
    expect(counterAfter - counterBefore).toBe(1n)
  })
})
