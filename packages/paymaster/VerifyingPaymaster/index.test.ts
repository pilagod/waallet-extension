import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

import { VerifyingPaymaster } from "./index"

describeWaalletSuite({
  name: "Verifying Paymaster",
  usePaymaster: async (cfg) => {
    return new VerifyingPaymaster(cfg.provider.node, {
      address: cfg.address.VerifyingPaymaster,
      ownerPrivateKey: cfg.wallet.operator.privateKey,
      expirationSecs: 300
    })
  },
  suite: (ctx) => {
    it("should pay for account", async () => {
      const {
        contract: { entryPoint },
        provider: { node }
      } = ctx

      const accountBalanceBefore = await node.getBalance(
        await ctx.account.getAddress()
      )
      const paymasterDepositBalanceBefore = await entryPoint.balanceOf(
        ctx.address.VerifyingPaymaster
      )

      await ctx.provider.waallet.request({
        method: WaalletRpcMethod.eth_sendTransaction,
        params: [
          {
            to: await ctx.account.getAddress(),
            value: 0
          }
        ]
      })

      const accountBalanceAfter = await node.getBalance(
        await ctx.account.getAddress()
      )
      expect(accountBalanceBefore).toBe(accountBalanceAfter)

      const paymasterDepositBalanceAfter = await entryPoint.balanceOf(
        ctx.address.VerifyingPaymaster
      )
      expect(paymasterDepositBalanceBefore).toBeGreaterThan(
        paymasterDepositBalanceAfter
      )
    })
  }
})
