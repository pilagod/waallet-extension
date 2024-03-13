import * as ethers from "ethers"

import config from "~config/test"
import { ECDSAValidator } from "~packages/account/imAccount/validator/ecdsaValidator"
import { WaalletBackgroundProvider } from "~packages/provider/waallet/background/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"
import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"
import type { HexString } from "~typing"

import { imAccount } from "./index"

async function setNewECDSAOwner(
  provider: WaalletBackgroundProvider,
  ecdsaValidator: ECDSAValidator,
  newOwnerAddress: string
) {
  await provider.request<HexString>({
    method: WaalletRpcMethod.eth_sendTransaction,
    params: [
      {
        to: await ecdsaValidator.getAddress(),
        data: ecdsaValidator.getSetOwnerCallData(newOwnerAddress)
      }
    ]
  })
}

describeAccountSuite(
  "imAccount",
  () => {
    const ecdsaValidator = new ECDSAValidator({
      address: config.address.ECDSAValidator,
      ownerPrivateKey: config.account.operator.privateKey,
      nodeRpcUrl: config.rpc.node
    })

    return imAccount.initWithFactory({
      factoryAddress: config.address.imAccountFactory,
      implementationAddress: config.address.imAccountImplementation,
      entryPointAddress: config.address.EntryPoint,
      validator: ecdsaValidator,
      fallbackHandlerAddress: config.address.FallbackHandler,
      salt: number.random(),
      nodeRpcUrl: config.rpc.node
    })
  },
  (ctx) => {
    // TODO: This test at this moment relies on tests in test bed to deploy the account.
    // It would be better to decouple it.
    it("should init with existing imAccount", async () => {
      const a = await imAccount.init({
        address: await ctx.account.getAddress(),
        nodeRpcUrl: config.rpc.node,
        validator: ctx.account.validator,
        entryPointAddress: config.address.EntryPoint
      })

      expect(await a.getAddress()).toBe(await ctx.account.getAddress())
    })

    // Set new ECDSAValidator owner
    it("should change the owner of ECDSAValidator", async () => {
      const ecdsaValidator = ctx.account.validator as ECDSAValidator
      const newOwner = ethers.Wallet.createRandom()
      await setNewECDSAOwner(ctx.provider, ecdsaValidator, newOwner.address)
      expect(
        await ecdsaValidator.getOwner(await ctx.account.getAddress())
      ).toBe(newOwner.address)

      const newECDSAValidator = new ECDSAValidator({
        address: config.address.ECDSAValidator,
        ownerPrivateKey: newOwner.privateKey,
        nodeRpcUrl: config.rpc.node
      })
      ctx.account.changeValidator(newECDSAValidator)

      const originalOwnerAddress = config.account.operator.address
      await setNewECDSAOwner(ctx.provider, ecdsaValidator, originalOwnerAddress)
      expect(
        await ecdsaValidator.getOwner(await ctx.account.getAddress())
      ).toBe(originalOwnerAddress)
    })
  }
)
