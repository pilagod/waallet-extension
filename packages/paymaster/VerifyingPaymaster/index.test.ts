import config from "~config/test"
import { UserOperation } from "~packages/bundler"
import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import type {
  UserOperationAuthorizeCallback,
  UserOperationAuthorizer
} from "~packages/waallet/background/authorizer/userOperation"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

import { VerifyingPaymaster } from "./index"

describeWaalletSuite("Verifying Paymaster", (ctx) => {
  const { bundler, node } = config.network.getActive()

  class VerifyingPaymasterUserOperationAuthorizer
    implements UserOperationAuthorizer
  {
    public constructor(private verifyingPaymaster: VerifyingPaymaster) {}

    public async authorize(
      userOp: UserOperation,
      { onApproved }: UserOperationAuthorizeCallback
    ) {
      userOp.setPaymasterAndData(
        await this.verifyingPaymaster.requestPaymasterAndData(node, userOp)
      )
      return onApproved(userOp)
    }
  }

  const verifyingPaymaster = new VerifyingPaymaster({
    address: config.address.VerifyingPaymaster,
    ownerPrivateKey: config.account.operator.privateKey,
    expirationSecs: 300
  })
  ctx.provider = ctx.provider.clone({
    paymaster: verifyingPaymaster,
    userOperationPool: new UserOperationSender(
      bundler,
      new VerifyingPaymasterUserOperationAuthorizer(verifyingPaymaster)
    )
  })

  it("should pay for account", async () => {
    const accountBalanceBefore = await node.getBalance(
      await ctx.account.getAddress()
    )
    const paymasterDepositBalanceBefore =
      await config.contract.entryPoint.balanceOf(
        config.address.VerifyingPaymaster
      )

    await ctx.provider.request({
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

    const paymasterDepositBalanceAfter =
      await config.contract.entryPoint.balanceOf(
        config.address.VerifyingPaymaster
      )
    expect(paymasterDepositBalanceBefore).toBeGreaterThan(
      paymasterDepositBalanceAfter
    )
  })
})
