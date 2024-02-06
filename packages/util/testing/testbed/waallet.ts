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
  suite?: (context: WaalletTestBedContext) => void
) {
  describe(name, () => {
    const context = new WaalletTestBedContext()
    const provider = new WaalletBackgroundProvider(
      config.rpc.node,
      config.provider.bundler,
      new NullUserOperationAuthorizer()
    )
    let account: SimpleAccount

    beforeAll(async () => {
      account = await SimpleAccount.init({
        address: config.address.SimpleAccount,
        ownerPrivateKey: config.account.operator.privateKey,
        nodeRpcUrl: config.rpc.node
      })
      provider.connect(account)
      context.account = account
      context.provider = provider
    })

    if (suite) {
      suite(context)
    }
  })
}
