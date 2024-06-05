import config from "~config/test"
import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

import { PasskeyAccount } from "./index"
import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

const owner = new PasskeyOwnerP256()

describeAccountSuite({
  name: "PasskeyAccount",
  useAccount: (runner) => {
    return PasskeyAccount.initWithFactory(runner, {
      owner,
      salt: number.random(),
      factoryAddress: config.address.PasskeyAccountFactory
    })
  },
  suite: (ctx) => {
    describe("init", () => {
      // TODO: This test at this moment relies on tests in test bed to deploy the account.
      // It would be better to decouple it.
      it("should init with existing passkey account", async () => {
        // Use `initCode`` to deploy account
        await ctx.provider.request({
          method: WaalletRpcMethod.eth_sendTransaction,
          params: [
            {
              to: await ctx.account.getAddress()
            }
          ]
        })
        const { node } = config.networkManager.getActive()
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
