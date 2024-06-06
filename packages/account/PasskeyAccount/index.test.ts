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
      factoryAddress: cfg.address.PasskeyAccountFactory
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
              to: await ctx.account.getAddress()
            }
          ]
        })

        const {
          provider: { node }
        } = ctx

        const account = await PasskeyAccount.init(node, {
          address: await ctx.account.getAddress(),
          owner
        })
        expect(await account.getAddress()).toBe(await ctx.account.getAddress())

        const credentialId = await PasskeyAccount.getCredentialId(
          node,
          await account.getAddress()
        )
        expect(credentialId).toBe(owner.getCredentialId())
      })
    })
  }
})
