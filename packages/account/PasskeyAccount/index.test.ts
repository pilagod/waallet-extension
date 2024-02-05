import config from "~config/test"
import number from "~packages/util/number"
import { describeAccountTestBed } from "~packages/util/testing/testbed/account"

import { PasskeyAccount } from "."
import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

describeAccountTestBed(
  "PasskeyAccount",
  async () => {
    const owner = new PasskeyOwnerP256()
    return PasskeyAccount.initWithFactory({
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
  (context) => {
    describe("init", () => {
      // TODO: This test at this moment relies on tests in test bed to deploy the account.
      // It would be better to decouple it.
      it("should init with existing passkey account", async () => {
        const { account } = context
        const a = await PasskeyAccount.init({
          address: await account.getAddress(),
          owner: new PasskeyOwnerP256(),
          nodeRpcUrl: config.rpc.node
        })
        expect(await a.getAddress()).toBe(await account.getAddress())
        expect(await a.getCredentialId()).toBe(await account.getCredentialId())
      })
    })
  }
)
