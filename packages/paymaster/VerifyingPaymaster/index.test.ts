import * as ethers from "ethers"

import config from "~config/test"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { UserOperation } from "~packages/provider/bundler"
import type {
  UserOperationAuthorizeCallback,
  UserOperationAuthorizer
} from "~packages/provider/waallet/background/authorizer/userOperation"
import { WaalletBackgroundProvider } from "~packages/provider/waallet/background/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"

import { VerifyingPaymaster } from "./index"

class VerifyingPaymasterUserOperationAuthorizer
  implements UserOperationAuthorizer
{
  public constructor(private verifyingPaymaster: VerifyingPaymaster) {}

  public async authorize(
    userOp: UserOperation,
    { onApproved }: UserOperationAuthorizeCallback
  ) {
    return onApproved({
      ...userOp,
      paymasterAndData:
        await this.verifyingPaymaster.requestPaymasterAndData(userOp)
    })
  }
}

describe("Verifying Paymaster", () => {
  const verifyingPaymaster = new VerifyingPaymaster({
    address: config.address.VerifyingPaymaster,
    ownerPrivateKey: config.account.operator.privateKey,
    expirationSecs: 300,
    nodeRpcUrl: config.rpc.node
  })
  const provider = new WaalletBackgroundProvider(
    config.rpc.node,
    config.provider.bundler,
    new VerifyingPaymasterUserOperationAuthorizer(verifyingPaymaster),
    verifyingPaymaster
  )
  let account: SimpleAccount

  beforeAll(async () => {
    account = await SimpleAccount.init({
      address: config.address.SimpleAccount,
      ownerPrivateKey: config.account.operator.privateKey,
      nodeRpcUrl: config.rpc.node
    })
    provider.connect(account)

    await (
      await config.account.operator.sendTransaction({
        to: await account.getAddress(),
        value: ethers.parseEther("1")
      })
    ).wait()
  })

  it("should pay for account", async () => {
    const { node } = config.provider

    const accountBalanceBefore = await node.getBalance(
      await account.getAddress()
    )
    const paymasterDepositBalanceBefore =
      await config.contract.entryPoint.balanceOf(
        config.address.VerifyingPaymaster
      )

    await provider.request({
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          to: await account.getAddress(),
          value: 0
        }
      ]
    })

    const accountBalanceAfter = await node.getBalance(
      await account.getAddress()
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
