import * as ethers from "ethers"

import config from "~config/test"
import type { Account } from "~packages/account"
import { NullUserOperationAuthorizer } from "~packages/provider/waallet/background/authorizer/userOperation/null"
import { WaalletBackgroundProvider } from "~packages/provider/waallet/background/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"
import byte from "~packages/util/byte"
import type { HexString } from "~typing"

export class AccountTestBedContext<T extends Account> {
  public account: T
  public provider: WaalletBackgroundProvider
}

export function describeAccountTestBed<T extends Account>(
  name: string,
  setup: () => Promise<T>,
  suite?: (context: AccountTestBedContext<T>) => void
) {
  describe(name, () => {
    const { node } = config.provider
    const { counter } = config.contract
    const context = new AccountTestBedContext<T>()
    const provider = new WaalletBackgroundProvider(
      config.rpc.node,
      config.provider.bundler,
      new NullUserOperationAuthorizer()
    )
    let account: T

    beforeAll(async () => {
      account = await setup()
      provider.connect(account)

      context.account = account
      context.provider = provider

      await (
        await config.account.operator.sendTransaction({
          to: await account.getAddress(),
          value: ethers.parseEther("1")
        })
      ).wait()
    })

    it("should get accounts", async () => {
      const accounts = await provider.request<HexString>({
        method: WaalletRpcMethod.eth_accounts
      })
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0]).toBe(await account.getAddress())
    })

    it("should request accounts", async () => {
      const accounts = await provider.request<HexString>({
        method: WaalletRpcMethod.eth_requestAccounts
      })
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0]).toBe(await account.getAddress())
    })

    it("should estimate gas", async () => {
      const gas = await provider.request<HexString>({
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

      await provider.request<HexString>({
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
      suite(context)
    }
  })
}
