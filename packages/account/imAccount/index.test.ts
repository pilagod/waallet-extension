import config from "~config/test"
import {
  createValidator,
  ValidatorType
} from "~packages/account/imAccount/validator"
import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"

import { imAccount } from "./index"

describeAccountSuite(
  "imAccount",
  () => {
    const ecdsaValidator = createValidator(
      ValidatorType.ECDSAValidator,
      config.address.ECDSAValidator,
      config.account.operator.privateKey,
      config.rpc.node
    )

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
    describe("init", () => {
      const ecdsaValidator = createValidator(
        ValidatorType.ECDSAValidator,
        config.address.ECDSAValidator,
        config.account.operator.privateKey,
        config.rpc.node
      )

      // TODO: This test at this moment relies on tests in test bed to deploy the account.
      // It would be better to decouple it.
      it("should init with existing imAccount", async () => {
        const a = await imAccount.init({
          address: await ctx.account.getAddress(),
          nodeRpcUrl: config.rpc.node,
          validator: ecdsaValidator,
          entryPointAddress: config.address.EntryPoint
        })

        expect(await a.getAddress()).toBe(await ctx.account.getAddress())
      })
    })
  }
)
