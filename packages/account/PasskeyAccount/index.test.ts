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
      factoryAddress: config.address.PasskeyAccountFactory,
      nodeRpcUrl: config.rpc.node
    })
  },
  (ctx) => {
    describe("init", () => {
      // TODO: This test at this moment relies on tests in test bed to deploy the account.
      // It would be better to decouple it.
      it("should init with existing passkey account", async () => {
        const a = await PasskeyAccount.init({
          address: await ctx.account.getAddress(),
          owner: new PasskeyOwnerP256(),
          nodeRpcUrl: config.rpc.node
        })
        expect(await a.getAddress()).toBe(await ctx.account.getAddress())
        expect(await a.getCredentialId()).toBe(
          await ctx.account.getCredentialId()
        )
      })
    })
  }
)
