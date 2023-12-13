import * as ethers from "ethers"

import config from "~config/test"
import type { UserOperation } from "~packages/provider/bundler/typing"
import { getUserOpHash } from "~packages/provider/bundler/util"
import number from "~packages/utils/number"
import type { BigNumberish } from "~typings"

import { SimpleAccountFactoryAdapter } from "./adapter/SimpleAccountFactory"
import { EoaOwnedAccount } from "./eoa"

describe("EoaOwnedAccount", () => {
  const owner = config.account.operator

  describe("With factory and salt", () => {
    let salt: BigNumberish
    let account: EoaOwnedAccount

    beforeEach(async () => {
      salt = number.random()
      account = await EoaOwnedAccount.initWithSalt({
        factoryAdapter: new SimpleAccountFactoryAdapter(
          config.address.SimpleAccountFactory,
          config.rpc.node
        ),
        salt,
        ownerPrivateKey: owner.privateKey
      })
    })

    it("should compute address from factory", async () => {
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

    it("should get init code", async () => {
      await owner.sendTransaction({
        to: await account.getAddress(),
        value: ethers.parseUnits("0.001", "ether")
      })
      const { node, bundler } = config.provider
      const { gasPrice } = await node.getFeeData()

      const codeBefore = await node.getCode(await account.getAddress())
      expect(codeBefore).toBe("0x")

      const userOp: UserOperation = {
        sender: await account.getAddress(),
        nonce: number.toHex(0),
        initCode: await account.getInitCode(),
        callData: "0x",
        callGasLimit: number.toHex(50000),
        verificationGasLimit: number.toHex(250000),
        preVerificationGas: number.toHex(50000),
        maxFeePerGas: number.toHex(gasPrice),
        maxPriorityFeePerGas: number.toHex(gasPrice),
        paymasterAndData: "0x",
        signature: "0x"
      }
      userOp.signature = await account.signMessage(
        await getUserOpHash(
          userOp,
          config.address.EntryPoint,
          await bundler.getChainId()
        )
      )
      const userOpHash = await bundler.sendUserOperation(
        userOp,
        config.address.EntryPoint
      )
      await bundler.wait(userOpHash)

      const codeAfter = await node.getCode(await account.getAddress())
      expect(codeAfter).not.toBe("0x")
    })
  })
})
