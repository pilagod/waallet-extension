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
import number from "~packages/util/number"

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
  const { node } = config.provider

  const verifyingPaymaster = new VerifyingPaymaster({
    address: config.address.VerifyingPaymaster,
    ownerPrivateKey: config.account.operator.privateKey,
    intervalSecs: 300,
    nodeRpcUrl: config.rpc.node
  })
  const provider = new WaalletBackgroundProvider(
    config.rpc.node,
    config.provider.bundler,
    new VerifyingPaymasterUserOperationAuthorizer(verifyingPaymaster)
  )
  let account: SimpleAccount

  beforeAll(async () => {
    account = await SimpleAccount.initWithFactory({
      ownerPrivateKey: config.account.operator.privateKey,
      factoryAddress: config.address.SimpleAccountFactory,
      salt: number.random(),
      nodeRpcUrl: config.rpc.node
    })
    provider.connect(account)
    provider.paymaster = verifyingPaymaster

    await (
      await config.account.operator.sendTransaction({
        to: await account.getAddress(),
        value: ethers.parseEther("1")
      })
    ).wait()
  })

  it("should pay for account", async () => {
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
          from: await account.getAddress(),
          to: await account.getAddress(),
          value: 0
        }
      ]
    })

    const accountBalanceAfter = await node.getBalance(
      await account.getAddress()
    )
    const paymasterDepositBalanceAfter =
      await config.contract.entryPoint.balanceOf(
        config.address.VerifyingPaymaster
      )
    expect(accountBalanceBefore).toBe(accountBalanceAfter)
    expect(paymasterDepositBalanceBefore).toBeGreaterThan(
      paymasterDepositBalanceAfter
    )
  })
})
