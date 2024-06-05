import { parseEther } from "ethers"

import config from "~config/test"
import type { Account } from "~packages/account"
import { SingleAccountManager } from "~packages/account/manager/single"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import type { ContractRunner } from "~packages/node"
import { TransactionToUserOperationSender } from "~packages/waallet/background/pool/transaction/sender"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

export class WaalletSuiteContext<T extends Account> {
  public account: T
  public provider: WaalletBackgroundProvider
}

// TODO: Should be able to customize account setup function
export function describeWaalletSuite<T extends Account>(option: {
  name: string
  setup?: (runner: ContractRunner) => Promise<T>
  suite?: (ctx: WaalletSuiteContext<T>) => void
}) {
  describe(option.name, () => {
    const ctx = new WaalletSuiteContext()

    beforeAll(async () => {
      const { node } = config.networkManager.getActive()

      if (option.setup) {
        ctx.account = await option.setup(node)
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
          config.networkManager
        )
      )

      await (
        await config.account.operator.sendTransaction({
          to: await ctx.account.getAddress(),
          value: parseEther("1")
        })
      ).wait()
    })

    if (option.suite) {
      option.suite(ctx as WaalletSuiteContext<T>)
    }
  })
}
