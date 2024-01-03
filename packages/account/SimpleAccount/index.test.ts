import config from "~config/test"
import number from "~packages/util/number"
import { describeAccountTestBed } from "~packages/util/testing/testbed/account"

import { SimpleAccount } from "."

describeAccountTestBed("SimpleAccount", async () => {
  return SimpleAccount.initWithFactory({
    ownerPrivateKey: config.account.operator.privateKey,
    factoryAddress: config.address.SimpleAccountFactory,
    salt: number.random(),
    nodeRpcUrl: config.rpc.node
  })
})
