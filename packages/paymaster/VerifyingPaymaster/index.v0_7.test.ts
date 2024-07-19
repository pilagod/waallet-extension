import { SimpleAccount } from "~packages/account/SimpleAccount"
import number from "~packages/util/number"
import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

import { VerifyingPaymaster } from "./index"

describeWaalletSuite({
  name: "Verifying Paymaster v0.7",
  useAccount: (cfg) => {
    return SimpleAccount.initWithFactory(cfg.provider.node, {
      ownerPrivateKey: cfg.wallet.operator.privateKey,
      factory: cfg.address.SimpleAccountFactoryV0_7,
      salt: number.random()
    })
  },
  usePaymaster: async (cfg) => {
    return new VerifyingPaymaster(cfg.provider.node, {
      address: cfg.address.VerifyingPaymasterV0_7,
      ownerPrivateKey: cfg.wallet.operator.privateKey,
      expirationSecs: 300
    })
  },
  suite: (ctx) => {
    it("should pay for account", async () => {
      const {
        contract: { entryPointV0_7 },
        provider: { node }
      } = ctx

      const accountBalanceBefore = await node.getBalance(
        await ctx.account.getAddress()
      )
      const paymasterDepositBalanceBefore = await entryPointV0_7.balanceOf(
        ctx.address.VerifyingPaymasterV0_7
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

      const paymasterDepositBalanceAfter = await entryPointV0_7.balanceOf(
        ctx.address.VerifyingPaymasterV0_7
      )
      expect(paymasterDepositBalanceBefore).toBeGreaterThan(
        paymasterDepositBalanceAfter
      )
    })
  }
})
