import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

import { VerifyingPaymaster } from "./index"

describeWaalletSuite({
  name: "Verifying Paymaster",
  usePaymaster: async (cfg) => {
    return new VerifyingPaymaster(cfg.provider.node, {
      address: cfg.address.VerifyingPaymasterV0_6,
      ownerPrivateKey: cfg.wallet.operator.privateKey,
      expirationSecs: 300
    })
  },
  suite: (ctx) => {
    it("should pay for account", async () => {
      const {
        contract: { entryPointV0_6 },
        provider: { node }
      } = ctx

      const accountBalanceBefore = await node.getBalance(
        (await ctx.account.getAddress()).unwrap()
      )
      const paymasterDepositBalanceBefore = await entryPointV0_6.balanceOf(
        ctx.address.VerifyingPaymasterV0_6
      )

      await ctx.provider.waallet.request({
        method: WaalletRpcMethod.eth_sendTransaction,
        params: [
          {
            to: (await ctx.account.getAddress()).unwrap(),
            value: 0
          }
        ]
      })

      const accountBalanceAfter = await node.getBalance(
        (await ctx.account.getAddress()).unwrap()
      )
      expect(accountBalanceBefore).toBe(accountBalanceAfter)

      const paymasterDepositBalanceAfter = await entryPointV0_6.balanceOf(
        ctx.address.VerifyingPaymasterV0_6
      )
      expect(paymasterDepositBalanceBefore).toBeGreaterThan(
        paymasterDepositBalanceAfter
      )
    })
  }
})
