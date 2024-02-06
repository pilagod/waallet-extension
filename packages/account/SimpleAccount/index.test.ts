import config from "~config/test"
import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"

import { SimpleAccount } from "./index"

describeAccountSuite("SimpleAccount", () => {
  return SimpleAccount.initWithFactory({
    ownerPrivateKey: config.account.operator.privateKey,
    factoryAddress: config.address.SimpleAccountFactory,
    salt: number.random(),
    nodeRpcUrl: config.rpc.node
  })
})
