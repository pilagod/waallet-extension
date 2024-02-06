import config from "~config/test"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { NullUserOperationAuthorizer } from "~packages/provider/waallet/background/authorizer/userOperation/null"
import { WaalletBackgroundProvider } from "~packages/provider/waallet/background/provider"

export class WaalletTestBedContext {
  public account: SimpleAccount
  public provider: WaalletBackgroundProvider
}

export function describeWaalletTestBed(
  name: string,
  suite?: (ctx: WaalletTestBedContext) => void
) {
  describe(name, () => {
    const ctx = new WaalletTestBedContext()

    ctx.provider = new WaalletBackgroundProvider(
      config.rpc.node,
      config.provider.bundler,
      new NullUserOperationAuthorizer()
    )

    beforeAll(async () => {
      ctx.account = await SimpleAccount.init({
        address: config.address.SimpleAccount,
        ownerPrivateKey: config.account.operator.privateKey,
        nodeRpcUrl: config.rpc.node
      })
      ctx.provider.connect(ctx.account)
    })

    if (suite) {
      suite(ctx)
    }
  })
}
