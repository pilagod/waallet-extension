import config from "~config/test"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { NullUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/null"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"

export class WaalletSuiteContext {
  public account: SimpleAccount
  public provider: WaalletBackgroundProvider
}

export function describeWaalletSuite(
  name: string,
  suite?: (ctx: WaalletSuiteContext) => void
) {
  describe(name, () => {
    const ctx = new WaalletSuiteContext()

    ctx.provider = new WaalletBackgroundProvider(
      config.rpc.node,
      config.provider.bundler,
      new NullUserOperationAuthorizer()
    )

    beforeAll(async () => {
      ctx.account = await SimpleAccount.init({
        address: config.address.SimpleAccount,
        ownerPrivateKey: config.account.operator.privateKey
      })
      ctx.provider.connect(ctx.account)
    })

    if (suite) {
      suite(ctx)
    }
  })
}
