import config from "~config/test"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { NullUserOperationAuthorizer } from "~packages/waallet/background/authorizer/userOperation/null"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
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
    const network = config.network.getActive()

    ctx.provider = new WaalletBackgroundProvider(
      config.network,
      new NullPaymaster(),
      new UserOperationSender(
        network.bundler,
        new NullUserOperationAuthorizer()
      )
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
