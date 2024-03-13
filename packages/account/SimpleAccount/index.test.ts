import config from "~config/test"
import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"

import { SimpleAccount } from "./index"

describeAccountSuite("SimpleAccount", (ctx) => {
  return SimpleAccount.initWithFactory(ctx, {
    ownerPrivateKey: config.account.operator.privateKey,
    factoryAddress: config.address.SimpleAccountFactory,
    salt: number.random()
  })
})
