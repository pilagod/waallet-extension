import { parseEther } from "ethers"

import config from "~config/test"
import type { Account } from "~packages/account"
import { SingleAccountManager } from "~packages/account/manager/single"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { SingleNetworkManager } from "~packages/network/manager/single"
import type { Paymaster } from "~packages/paymaster"
import { TransactionToUserOperationSender } from "~packages/waallet/background/pool/transaction/sender"
import { WaalletBackgroundProvider } from "~packages/waallet/background/provider"
import type { BigNumberish } from "~typing"

export type WaalletSuiteOption<A extends Account, P extends Paymaster> = {
  name: string
  useAccount?: (cfg: typeof config) => Promise<A>
  usePaymaster?: (cfg: typeof config) => Promise<P>
  suite?: (ctx: WaalletSuiteContext<A>) => void
}

export class WaalletSuiteContext<T extends Account> {
  public address = config.address
  public contract = config.contract
  public provider: typeof config.provider & {
    waallet: WaalletBackgroundProvider
  } = {
    ...config.provider,
    waallet: null
  }
  public wallet = config.wallet

  public account: T

  public async topupAccount(balance?: BigNumberish) {
    // TODO: Use default paymaster to accelerate
    return (
      await config.wallet.operator.sendTransaction({
        to: await this.account.getAddress(),
        value: balance ?? parseEther("1")
      })
    ).wait()
  }
}

// TODO: Should be able to customize account setup function
export function describeWaalletSuite<A extends Account, P extends Paymaster>(
  option: WaalletSuiteOption<A, P>
) {
  describe(option.name, () => {
    const ctx = new WaalletSuiteContext()

    beforeEach(async () => {
      const {
        provider: { node, bundler }
      } = ctx

      // Setup account manager
      if (option.useAccount) {
        ctx.account = await option.useAccount(ctx)
      } else {
        ctx.account = await SimpleAccount.init(node, {
          address: ctx.address.SimpleAccount,
          ownerPrivateKey: ctx.wallet.operator.privateKey
        })
      }
      const accountManager = new SingleAccountManager(ctx.account)

      // Setup network manager
      const { chainId } = await node.getNetwork()
      const networkManager = new SingleNetworkManager({
        chaindId: Number(chainId),
        nodeRpcUrl: node.url,
        bundlerRpcUrl: bundler.url
      })

      ctx.provider.waallet = new WaalletBackgroundProvider(
        accountManager,
        networkManager,
        new TransactionToUserOperationSender(
          accountManager,
          networkManager,
          async (userOp, forGasEstimation) => {
            if (!option.usePaymaster) {
              return
            }
            const paymaster = await option.usePaymaster(ctx)
            userOp.setPaymasterAndData(
              await paymaster.requestPaymasterAndData(userOp, forGasEstimation)
            )
          }
        )
      )
    })

    if (option.suite) {
      option.suite(ctx as WaalletSuiteContext<A>)
    }
  })
}
