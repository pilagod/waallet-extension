import number from "~packages/util/number"
import { describeAccountSuite } from "~packages/util/testing/suite/account"

import { SimpleAccount } from "./index"

describeAccountSuite({
  name: "SimpleAccount v0.6",
  useAccount: (cfg) => {
    return SimpleAccount.initWithFactory(cfg.provider.node, {
      ownerPrivateKey: cfg.wallet.operator.privateKey,
      factory: cfg.address.SimpleAccountFactoryV0_6,
      salt: number.random()
    })
  }
})
