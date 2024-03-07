import config from "~config/test"
import { ValidatorType } from "~packages/account/imAccount/validator"
import { describeAccountSuite } from "~packages/util/testing/suite/account"

import { imAccount } from "./index"

describeAccountSuite(
  "imAccount",
  () => {
    return imAccount.initWithFactory({
      ownerInfo: config.account.operator.address,
      ownerKeyInfo: config.account.operator.privateKey,
      factoryAddress: config.address.imAccountFactory,
      implementationAddress: config.address.imAccountImplementation,
      entryPointAddress: config.address.EntryPoint,
      defaultValidatorType: ValidatorType.ECDSAValidator,
      defaultValidatorAddress: config.address.ECDSAValidator,
      fallbackHandlerAddress: config.address.FallbackHandler,
      salt: 1,
      nodeRpcUrl: config.rpc.node
    })
  },
  (ctx) => {
    describe("init", () => {
      // TODO: This test at this moment relies on tests in test bed to deploy the account.
      // It would be better to decouple it.
      it("should init with existing imAccount", async () => {
        const a = await imAccount.init({
          address: await ctx.account.getAddress(),
          ownerKeyInfo: config.account.operator.privateKey,
          nodeRpcUrl: config.rpc.node,
          defaultValidatorType: ValidatorType.ECDSAValidator,
          defaultValidatorAddress: config.address.ECDSAValidator,
          entryPointAddress: config.address.EntryPoint
        })

        expect(await a.getAddress()).toBe(await ctx.account.getAddress())
      })
    })
  }
)
