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
  (account, provider) => {
    describe("init", () => {
      it("should init with existing passkey account", async () => {
        const pa = await PasskeyAccount.init({
          address: config.address.PasskeyAccount,
          owner: new PasskeyOwnerP256(),
          nodeRpcUrl: config.rpc.node
        })
        expect(await pa.getAddress()).toBe(config.address.PasskeyAccount)
        expect(await pa.getCredentialId()).toBeTruthy()
      })
    })
  }
)
