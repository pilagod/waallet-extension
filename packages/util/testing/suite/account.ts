import * as ethers from "ethers"

import config from "~config/test"
import type { Account } from "~packages/account"
import type { NetworkContext } from "~packages/context/network"
import byte from "~packages/util/byte"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { HexString } from "~typing"

import { describeWaalletSuite } from "./waallet"

export class AccountSuiteContext<T extends Account> {
  public account: T
  public provider: WaalletBackgroundProvider
}

export function describeAccountSuite<T extends Account>(
  name: string,
  setup: (ctx: NetworkContext) => Promise<T>,
  suite?: (ctx: AccountSuiteContext<T>) => void
) {
  describeWaalletSuite(name, ({ provider }) => {
    const { node } = config.provider
    const { counter } = config.contract

    const ctx = new AccountSuiteContext<T>()
    ctx.provider = provider.clone()

    beforeAll(async () => {
      ctx.account = await setup(ctx.provider)
      ctx.provider.connect(ctx.account)
      await (
        await config.account.operator.sendTransaction({
          to: await ctx.account.getAddress(),
          value: ethers.parseEther("1")
        })
      ).wait()
    })

    it("should get accounts", async () => {
      const accounts = await ctx.provider.request<HexString>({
        method: WaalletRpcMethod.eth_accounts
      })
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0]).toBe(await ctx.account.getAddress())
    })

    it("should request accounts", async () => {
      const accounts = await ctx.provider.request<HexString>({
        method: WaalletRpcMethod.eth_requestAccounts
      })
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0]).toBe(await ctx.account.getAddress())
    })

    it("should estimate gas", async () => {
      const gas = await ctx.provider.request<HexString>({
        method: WaalletRpcMethod.eth_estimateGas,
        params: [
          {
            to: await counter.getAddress(),
            value: 1,
            data: counter.interface.encodeFunctionData("increment", [])
          }
        ]
      })
      expect(byte.isHex(gas)).toBe(true)
      expect(parseInt(gas, 16)).toBeGreaterThan(0)
    })

    it("should send transaction to contract", async () => {
      const balanceBefore = await node.getBalance(counter.getAddress())
      const counterBefore = (await counter.number()) as bigint

      await ctx.provider.request<HexString>({
        method: WaalletRpcMethod.eth_sendTransaction,
        params: [
          {
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

    if (suite) {
      suite(ctx)
    }
  })
}
