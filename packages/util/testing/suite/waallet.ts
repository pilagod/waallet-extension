import config from "~config/test"
import { SingleAccountManager } from "~packages/account/manager/single"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { NullUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/null"
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

    ctx.provider = new WaalletBackgroundProvider(
      new SingleAccountManager(null),
      config.networkManager,
      new NullPaymaster(),
      new UserOperationSender(
        config.networkManager,
        new NullUserOperationAuthorizer()
      )
    )

    beforeAll(async () => {
      ctx.account = await SimpleAccount.init({
        address: config.address.SimpleAccount,
        ownerPrivateKey: config.account.operator.privateKey
      })
      ctx.provider = ctx.provider.clone({
        accountManager: new SingleAccountManager(ctx.account)
      })
    })

    if (suite) {
      suite(ctx)
    }
  })
}
