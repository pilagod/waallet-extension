import { parseEther } from "ethers"

import config from "~config/test"
import type { Account } from "~packages/account"
import { SingleAccountManager } from "~packages/account/manager/single"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { ContractRunner } from "~packages/node"
import type { Paymaster } from "~packages/paymaster"
import { TransactionToUserOperationSender } from "~packages/waallet/background/pool/transaction/sender"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

export type WaalletSuiteOption<A extends Account, P extends Paymaster> = {
  name: string
  useAccount?: (runner: ContractRunner) => Promise<A>
  usePaymaster?: (runner: ContractRunner) => Promise<P>
  suite?: (ctx: WaalletSuiteContext<A>) => void
}

export class WaalletSuiteContext<T extends Account> {
  public account: T
  public provider: WaalletBackgroundProvider
}

// TODO: Should be able to customize account setup function
export function describeWaalletSuite<A extends Account, P extends Paymaster>(
  option: WaalletSuiteOption<A, P>
) {
  describe(option.name, () => {
    const ctx = new WaalletSuiteContext()

    beforeEach(async () => {
      const { node } = config.networkManager.getActive()

      if (option.useAccount) {
        ctx.account = await option.useAccount(node)
      } else {
        ctx.account = await SimpleAccount.init(node, {
          address: config.address.SimpleAccount,
          ownerPrivateKey: config.account.operator.privateKey
        })
      }
      const accountManager = new SingleAccountManager(ctx.account)

      ctx.provider = new WaalletBackgroundProvider(
        accountManager,
        config.networkManager,
        new TransactionToUserOperationSender(
          accountManager,
          config.networkManager,
          async (userOp, forGasEstimation) => {
            if (!option.usePaymaster) {
              return
            }
            const paymaster = await option.usePaymaster(node)
            userOp.setPaymasterAndData(
              await paymaster.requestPaymasterAndData(userOp, forGasEstimation)
            )
          }
        )
      )

      // TODO: Use default paymaster to accelerate
      await (
        await config.account.operator.sendTransaction({
          to: await ctx.account.getAddress(),
          value: parseEther("1")
        })
      ).wait()
    })

    if (option.suite) {
      option.suite(ctx as WaalletSuiteContext<A>)
    }
  })
}
