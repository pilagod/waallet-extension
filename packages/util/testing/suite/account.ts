import type { Account } from "~packages/account"
import type { Paymaster } from "~packages/paymaster"
import byte from "~packages/util/byte"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { HexString } from "~typing"

import {
  describeWaalletSuite,
  WaalletSuiteContext,
  type WaalletSuiteOption
} from "./waallet"

export function describeAccountSuite<A extends Account, P extends Paymaster>(
  option: WaalletSuiteOption<A, P>
) {
  describeWaalletSuite({
    ...option,
    suite: (ctx) => {
      it("should get accounts", async () => {
        const accounts = await ctx.provider.waallet.request<HexString>({
          method: WaalletRpcMethod.eth_accounts
        })
        expect(accounts.length).toBeGreaterThan(0)
        expect(accounts[0]).toBe((await ctx.account.getAddress()).unwrap())
      })

      it("should request accounts", async () => {
        const accounts = await ctx.provider.waallet.request<HexString>({
          method: WaalletRpcMethod.eth_requestAccounts
        })
        expect(accounts.length).toBeGreaterThan(0)
        expect(accounts[0]).toBe((await ctx.account.getAddress()).unwrap())
      })

      it("should estimate gas", async () => {
        await ctx.topupAccount()

        const {
          contract: { counter }
        } = ctx

        const gas = await ctx.provider.waallet.request<HexString>({
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
        await ctx.topupAccount()

        const {
          contract: { counter },
          provider: { node }
        } = ctx

        const balanceBefore = await node.getBalance(counter.getAddress())
        const counterBefore = (await counter.number()) as bigint

        await ctx.provider.waallet.request<HexString>({
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
        option.suite(ctx as WaalletSuiteContext<A>)
      }
    }
  })
}
