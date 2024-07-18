import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

import { PasskeyAccount } from "./index"
import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

const owner = new PasskeyOwnerP256()

describeAccountSuite({
  name: "PasskeyAccount",
  useAccount: (cfg) => {
    return PasskeyAccount.initWithFactory(cfg.provider.node, {
      owner,
      salt: number.random(),
      factory: cfg.address.PasskeyAccountFactoryV0_6
    })
  },
  suite: (ctx) => {
    describe("init", () => {
      it("should init with existing passkey account", async () => {
        await ctx.topupAccount()

        // Use `initCode`` to deploy account
        await ctx.provider.waallet.request({
          method: WaalletRpcMethod.eth_sendTransaction,
          params: [
            {
              to: ctx.account.getAddress().unwrap()
            }
          ]
        })

        const {
          provider: { node }
        } = ctx

        const account = await PasskeyAccount.init(node, {
          address: ctx.account.getAddress(),
          owner
        })
        expect(account.getAddress().isEqual(ctx.account.getAddress())).toBe(
          true
        )

        const credentialId = await PasskeyAccount.getCredentialId(
          node,
          account.getAddress()
        )
        expect(credentialId).toBe(owner.getCredentialId())
      })
    })
  }
})
