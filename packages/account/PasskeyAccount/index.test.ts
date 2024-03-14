import config from "~config/test"
import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"

import { PasskeyAccount } from "./index"
import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

describeAccountSuite(
  "PasskeyAccount",
  (ctx) => {
    const owner = new PasskeyOwnerP256()
    return PasskeyAccount.initWithFactory(ctx, {
      owner,
      credentialId: Buffer.from(owner.publicKey).toString("hex"),
      publicKey: {
        x: owner.x,
        y: owner.y
      },
      salt: number.random(),
      factoryAddress: config.address.PasskeyAccountFactory
    })
  },
  (ctx) => {
    describe("init", () => {
      // TODO: This test at this moment relies on tests in test bed to deploy the account.
      // It would be better to decouple it.
      it("should init with existing passkey account", async () => {
        const a = await PasskeyAccount.init(ctx.provider.node, {
          address: await ctx.account.getAddress(),
          owner: new PasskeyOwnerP256()
        })
        expect(await a.getAddress()).toBe(await ctx.account.getAddress())
        expect(await a.getCredentialId(ctx.provider.node)).toBe(
          await ctx.account.getCredentialId(ctx.provider.node)
        )
      })
    })
  }
)
