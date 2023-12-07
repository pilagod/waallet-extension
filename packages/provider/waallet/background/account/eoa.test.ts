import * as ethers from "ethers"

import config from "~config/test"

import { EoaOwnedAccount } from "./eoa"

describe("EoaOwnedAccount", () => {
  const owner = new ethers.Wallet(
    config.account.operator.privateKey,
    config.provider.node
  )

  it("should compute address from factory", async () => {
    const salt = 123
    const account = new EoaOwnedAccount({
      ownerPrivateKey: config.account.operator.privateKey,
      factoryAddress: config.address.SimpleAccountFactory,
      salt,
      nodeRpcUrl: config.rpc.node
    })

    const got = await account.getAddress()
    const expected = await config.provider.node.call(
      await config.contract.simpleAccountFactory
        .getFunction("getAddress")
        .populateTransaction(owner.address, salt)
    )
    expect(got).toMatch(/^0x/)
    expect(got).toHaveLength(42)
    expect(ethers.toBigInt(got)).toBe(ethers.toBigInt(expected))
  })
})
