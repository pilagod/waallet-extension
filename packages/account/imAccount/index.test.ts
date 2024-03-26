import * as ethers from "ethers"

import config from "~config/test"
import { ECDSAValidator } from "~packages/account/imAccount/validator/ecdsaValidator"
import { WebAuthnValidator } from "~packages/account/imAccount/validator/webAuthnValidator"
import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { BytesLike, HexString } from "~typing"

import { imAccount } from "./index"
import { P256Owner } from "./validator/P256Owner"

async function setNewECDSAOwner(
  provider: WaalletBackgroundProvider,
  ecdsaValidator: ECDSAValidator,
  newOwnerAddress: string
) {
  await provider.request<HexString>({
    method: WaalletRpcMethod.eth_sendTransaction,
    params: [
      {
        to: await ecdsaValidator.getAddress(provider.node),
        data: ecdsaValidator.getSetOwnerCallData(newOwnerAddress)
      }
    ]
  })
}

async function setNewWebAuthnOwner(
  provider: WaalletBackgroundProvider,
  webAuthnValidator: WebAuthnValidator,
  ownerX: bigint,
  ownerY: bigint,
  authenticatorRPIDHash: BytesLike
) {
  await provider.request<HexString>({
    method: WaalletRpcMethod.eth_sendTransaction,
    params: [
      {
        to: await webAuthnValidator.getAddress(provider.node),
        data: webAuthnValidator.getSetOwnerAndAuthenticatorRPIDHashCallData(
          ownerX,
          ownerY,
          authenticatorRPIDHash
        )
      }
    ]
  })
}

describeAccountSuite(
  "imAccount with ECDSAValidator",
  (runner) => {
    const ecdsaValidator = new ECDSAValidator({
      address: config.address.ECDSAValidator,
      ownerPrivateKey: config.account.operator.privateKey
    })

    return imAccount.initWithFactory(runner, {
      factoryAddress: config.address.imAccountFactory,
      implementationAddress: config.address.imAccountImplementation,
      entryPointAddress: config.address.EntryPoint,
      validator: ecdsaValidator,
      fallbackHandlerAddress: config.address.FallbackHandler,
      salt: number.random()
    })
  },
  (ctx) => {
    // TODO: This test at this moment relies on tests in test bed to deploy the account.
    // It would be better to decouple it.
    it("should init with existing imAccount", async () => {
      const a = await imAccount.init({
        address: await ctx.account.getAddress(),
        validator: ctx.account.validator
      })

      expect(await a.getAddress()).toBe(await ctx.account.getAddress())
    })

    // Set new ECDSAValidator owner
    it("should change the owner of ECDSAValidator", async () => {
      const ecdsaValidator = ctx.account.validator as ECDSAValidator
      const newOwner = ethers.Wallet.createRandom()
      await setNewECDSAOwner(ctx.provider, ecdsaValidator, newOwner.address)
      expect(
        await ecdsaValidator.getOwner(
          ctx.provider.node,
          await ctx.account.getAddress()
        )
      ).toBe(newOwner.address)

      const newECDSAValidator = new ECDSAValidator({
        address: config.address.ECDSAValidator,
        ownerPrivateKey: newOwner.privateKey
      })
      ctx.account.changeValidator(newECDSAValidator)

      const originalOwnerAddress = config.account.operator.address
      await setNewECDSAOwner(ctx.provider, ecdsaValidator, originalOwnerAddress)
      expect(
        await ecdsaValidator.getOwner(
          ctx.provider.node,
          await ctx.account.getAddress()
        )
      ).toBe(originalOwnerAddress)
    })
  }
)

describeAccountSuite(
  "imAccount with WebAuthnValidator (P256Owner)",
  (runner) => {
    const p256Owner = new P256Owner()
    const webAuthnValidator = new WebAuthnValidator({
      address: config.address.WebAuthnValidator,
      owner: p256Owner,
      x: p256Owner.x,
      y: p256Owner.y,
      credentialId: Buffer.from(p256Owner.publicKey).toString("hex")
    })

    return imAccount.initWithFactory(runner, {
      factoryAddress: config.address.imAccountFactory,
      implementationAddress: config.address.imAccountImplementation,
      entryPointAddress: config.address.EntryPoint,
      validator: webAuthnValidator,
      fallbackHandlerAddress: config.address.FallbackHandler,
      salt: number.random()
    })
  },
  (ctx) => {
    // TODO: This test at this moment relies on tests in test bed to deploy the account.
    // It would be better to decouple it.
    it("should init with existing imAccount", async () => {
      const a = await imAccount.init({
        address: await ctx.account.getAddress(),
        validator: ctx.account.validator
      })

      expect(await a.getAddress()).toBe(await ctx.account.getAddress())
    })

    // Set new WebAuthnValidator owner
    it("should change the P256Owner of WebAuthnValidator", async () => {
      const p256Owner = new P256Owner()
      const webAuthnValidator = new WebAuthnValidator({
        address: config.address.WebAuthnValidator,
        owner: p256Owner,
        x: p256Owner.x,
        y: p256Owner.y,
        credentialId: Buffer.from(p256Owner.publicKey).toString("hex")
      })
      await setNewWebAuthnOwner(
        ctx.provider,
        webAuthnValidator,
        p256Owner.x,
        p256Owner.y,
        p256Owner.defaultRpidHash
      )

      expect(
        await webAuthnValidator.getOwner(
          ctx.provider.node,
          await ctx.account.getAddress()
        )
      ).toEqual([p256Owner.x, p256Owner.y])
    })
  }
)
