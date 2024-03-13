import config from "~config/test"
import { UserOperation } from "~packages/bundler"
import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import type {
  UserOperationAuthorizeCallback,
  UserOperationAuthorizer
} from "~packages/waallet/background/authorizer/userOperation"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

import { VerifyingPaymaster } from "./index"

class VerifyingPaymasterUserOperationAuthorizer
  implements UserOperationAuthorizer
{
  public constructor(private verifyingPaymaster: VerifyingPaymaster) {}

  public async authorize(
    userOp: UserOperation,
    { onApproved }: UserOperationAuthorizeCallback
  ) {
    userOp.setPaymasterAndData(
      await this.verifyingPaymaster.requestPaymasterAndData(userOp)
    )
    return onApproved(userOp)
  }
}

describeWaalletSuite("Verifying Paymaster", (ctx) => {
  const verifyingPaymaster = new VerifyingPaymaster({
    address: config.address.VerifyingPaymaster,
    ownerPrivateKey: config.account.operator.privateKey,
    expirationSecs: 300,
    provider: config.provider.node
  })
  ctx.provider = ctx.provider.clone({
    userOperationAuthorizer: new VerifyingPaymasterUserOperationAuthorizer(
      verifyingPaymaster
    ),
    paymaster: verifyingPaymaster
  })

  it("should pay for account", async () => {
    const accountBalanceBefore = await ctx.provider.node.getBalance(
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

    const accountBalanceAfter = await ctx.provider.node.getBalance(
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
