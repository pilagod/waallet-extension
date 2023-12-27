import * as ethers from "ethers"

import config from "~config/test"
import number from "~packages/number"
import { WaalletBackgroundProvider } from "~packages/provider/waallet/background/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"
import type { HexString } from "~typing"

import { PasskeyAccount } from "./PasskeyAccount"
import { PasskeyOwnerP256 } from "./PasskeyOwnerP256"

describe("PasskeyAccount", () => {
  const { node } = config.provider
  const { counter } = config.contract

  // TODO: Extract a setup util for account testing
  const waalletProvider = new WaalletBackgroundProvider(
    config.rpc.node,
    config.provider.bundler
  )
  const owner = new PasskeyOwnerP256()
  let account: PasskeyAccount

  beforeAll(async () => {
    account = await PasskeyAccount.initWithFactory({
      owner,
      credentialId: Buffer.from(owner.publicKey).toString("hex"),
      publicKey: {
        x: owner.x,
        y: owner.y
      },
      salt: number.random(),
      factoryAddress: config.address.PasskeyAccountFactory,
      nodeRpcUrl: config.rpc.node
    })
    waalletProvider.connect(account)

    const tx = await config.account.operator.sendTransaction({
      to: await account.getAddress(),
      value: ethers.parseEther("0.01")
    })
    await tx.wait()
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
