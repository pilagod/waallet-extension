import * as ethers from "ethers"

import config from "~config/test"
import number from "~packages/number"
import { getUserOpHash } from "~packages/provider/bundler/util"
import type { BigNumberish } from "~typing"

import { SimpleAccount } from "./SimpleAccount"

describe("SimpleAccount", () => {
  const owner = config.account.operator

  describe("With factory and salt", () => {
    let salt: BigNumberish
    let account: SimpleAccount

    beforeEach(async () => {
      salt = number.random()
      account = await SimpleAccount.initWithFactory({
        ownerPrivateKey: owner.privateKey,
        factoryAddress: config.address.SimpleAccountFactory,
        salt,
        nodeRpcUrl: config.rpc.node
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

    it("should deploy account by first user operation", async () => {
      await owner.sendTransaction({
        to: await account.getAddress(),
        value: ethers.parseUnits("0.01", "ether")
      })
      const { node, bundler } = config.provider
      const { gasPrice } = await node.getFeeData()

      expect(await account.isDeployed()).toBe(false)

      const userOpCall = await account.createUserOperationCall()
      const userOp = {
        ...userOpCall,
        callGasLimit: number.toHex(50000),
        verificationGasLimit: number.toHex(250000),
        preVerificationGas: number.toHex(50000),
        maxFeePerGas: number.toHex(gasPrice),
        maxPriorityFeePerGas: number.toHex(gasPrice),
        paymasterAndData: "0x"
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

      expect(await account.isDeployed()).toBe(true)
    })
  })
})
