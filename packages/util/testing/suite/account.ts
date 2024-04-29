import * as ethers from "ethers"

import config from "~config/test"
import type { Account } from "~packages/account"
import { SingleAccountManager } from "~packages/account/manager/single"
import type { ContractRunner } from "~packages/node"
import byte from "~packages/util/byte"
import { NullUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/null"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
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
  setup: (runner: ContractRunner) => Promise<T>,
  suite?: (ctx: AccountSuiteContext<T>) => void
) {
  describeWaalletSuite(name, (waalletSuiteCtx) => {
    const { node } = config.networkManager.getActive()
    const { counter } = config.contract

    const ctx = new AccountSuiteContext<T>()

    beforeAll(async () => {
      ctx.account = await setup(node)
      // TODO: Fix inconsistency between waallet provider and user operation sender
      const accountManager = new SingleAccountManager(ctx.account)
      ctx.provider = waalletSuiteCtx.provider.clone({
        accountManager,
        userOperationPool: new UserOperationSender(
          accountManager,
          config.networkManager,
          new NullUserOperationAuthorizer()
        )
      })
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
