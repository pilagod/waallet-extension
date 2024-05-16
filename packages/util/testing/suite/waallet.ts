import config from "~config/test"
import { SingleAccountManager } from "~packages/account/manager/single"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

export class WaalletSuiteContext {
  public account: SimpleAccount
  public provider: WaalletBackgroundProvider
}

// TODO: Should be able to customize account setup function
export function describeWaalletSuite(
  name: string,
  suite?: (ctx: WaalletSuiteContext) => void
) {
  describe(name, () => {
    const ctx = new WaalletSuiteContext()

    beforeAll(async () => {
      ctx.account = await SimpleAccount.init({
        address: config.address.SimpleAccount,
        ownerPrivateKey: config.account.operator.privateKey
      })
      const accountManager = new SingleAccountManager(ctx.account)
      ctx.provider = new WaalletBackgroundProvider(
        accountManager,
        config.networkManager,
        new UserOperationSender(accountManager, config.networkManager)
      )
    })

    if (suite) {
      suite(ctx)
    }
  })
}
