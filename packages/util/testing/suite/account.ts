import config from "~config/test"
import type { Account } from "~packages/account"
import type { ContractRunner } from "~packages/node"
import byte from "~packages/util/byte"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { HexString } from "~typing"

import { describeWaalletSuite, WaalletSuiteContext } from "./waallet"

export function describeAccountSuite<T extends Account>(option: {
  name: string
  setup: (runner: ContractRunner) => Promise<T>
  suite?: (ctx: WaalletSuiteContext<T>) => void
}) {
  describeWaalletSuite({
    name: option.name,
    setup: option.setup,
    suite: (ctx) => {
      const { node } = config.networkManager.getActive()
      const { counter } = config.contract

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

      if (option.suite) {
        option.suite(ctx as WaalletSuiteContext<T>)
      }
    }
  })
}
