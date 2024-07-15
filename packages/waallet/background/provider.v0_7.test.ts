import { SimpleAccount } from "~packages/account/SimpleAccount"
import byte from "~packages/util/byte"
import number from "~packages/util/number"
import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { HexString } from "~typing"

describeWaalletSuite({
  name: "WalletBackgroundProvider v0.7",
  useAccount: (cfg) => {
    return SimpleAccount.initWithFactory(cfg.provider.node, {
      ownerPrivateKey: cfg.wallet.operator.privateKey,
      factoryAddress: cfg.address.SimpleAccountFactoryV0_7,
      salt: number.random()
    })
  },
  suite: (ctx) => {
    it("should get chain id", async () => {
      const chainId = await ctx.provider.waallet.request<HexString>({
        method: WaalletRpcMethod.eth_chainId
      })
      expect(parseInt(chainId, 16)).toBe(1337)
    })

    it("should get block number", async () => {
      const blockNumber = await ctx.provider.waallet.request<HexString>({
        method: WaalletRpcMethod.eth_blockNumber
      })
      expect(parseInt(blockNumber, 16)).toBeGreaterThan(0)
    })

    it("should get accounts", async () => {
      const accounts = await ctx.provider.waallet.request<HexString>({
        method: WaalletRpcMethod.eth_accounts
      })
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0]).toHaveLength(42)
    })

    it("should request accounts", async () => {
      const accounts = await ctx.provider.waallet.request<HexString>({
        method: WaalletRpcMethod.eth_requestAccounts
      })
      expect(accounts.length).toBeGreaterThan(0)
      expect(accounts[0]).toHaveLength(42)
    })

    it("should estimate gas", async () => {
      await ctx.topupAccount()

      const {
        contract: { counter }
      } = ctx

      const gas = await ctx.provider.waallet.request<HexString>({
        method: WaalletRpcMethod.eth_estimateGas,
        params: [
          {
            to: await counter.getAddress(),
            value: 1,
            data: counter.interface.encodeFunctionData("increment", [])
          }
        ]
      })
      expect(byte.isHex(gas)).toBe(true)
      expect(parseInt(gas, 16)).toBeGreaterThan(0)
    })

    it("should fail to estimate user operation when nonce doesn't match the one on chain", async () => {
      await ctx.topupAccount()

      const {
        contract: { counter },
        provider: { bundler }
      } = ctx

      const userOp = bundler.deriveUserOperation(
        await ctx.account.buildExecution({
          to: await counter.getAddress(),
          value: 1,
          data: counter.interface.encodeFunctionData("increment", [])
        }),
        await ctx.account.getEntryPoint()
      )
      // Use custom nonce which doesn't match the one on chain
      userOp.setNonce(userOp.nonce + 1n)

      const useInvalidNonce = async () =>
        ctx.provider.waallet.request<{
          preVerificationGas: HexString
          verificationGasLimit: HexString
          callGasLimit: HexString
        }>({
          method: WaalletRpcMethod.eth_estimateUserOperationGas,
          params: [userOp.unwrap(), await ctx.account.getEntryPoint()]
        })

      await expect(useInvalidNonce()).rejects.toThrow()
    })

    it("should send transaction to contract", async () => {
      console.log("should send transaction to contract")

      console.log("topup account")
      await ctx.topupAccount()
      console.log("topup account ended")

      const {
        contract: { counter },
        provider: { node }
      } = ctx

      console.log("balance before")
      const balanceBefore = await node.getBalance(counter.getAddress())
      console.log("counter before")
      const counterBefore = (await counter.number()) as bigint

      try {
        console.log("send transaction")
        const txHash = await ctx.provider.waallet.request<HexString>({
          method: WaalletRpcMethod.eth_sendTransaction,
          params: [
            {
              to: await counter.getAddress(),
              value: 1,
              data: counter.interface.encodeFunctionData("increment", [])
            }
          ]
        })
        const receipt = await node.getTransactionReceipt(txHash)
        expect(receipt.status).toBe(1)
      } catch (e) {
        console.log("send transaction error:", e)
      }

      const balanceAfter = await node.getBalance(counter.getAddress())
      expect(balanceAfter - balanceBefore).toBe(1n)

      const counterAfter = (await counter.number()) as bigint
      expect(counterAfter - counterBefore).toBe(1n)
    })

    it("should send user operation", async () => {
      await ctx.topupAccount()

      const {
        contract: { counter },
        provider: { node, bundler }
      } = ctx

      const counterBefore = (await counter.number()) as bigint
      const counterBalanceBefore = await node.getBalance(
        await counter.getAddress()
      )

      const userOp = bundler.deriveUserOperation(
        await ctx.account.buildExecution({
          to: await counter.getAddress(),
          value: 1,
          data: counter.interface.encodeFunctionData("increment", [])
        }),
        await ctx.account.getEntryPoint()
      )

      const gasFee = await ctx.provider.waallet.request({
        method: WaalletRpcMethod.custom_estimateGasPrice
      })
      userOp.setGasFee(gasFee)

      const entryPoint = await ctx.account.getEntryPoint()
      userOp.setGasLimit(
        await bundler.estimateUserOperationGas(userOp, entryPoint)
      )

      const chainId = await bundler.getChainId()
      userOp.setSignature(
        await ctx.account.sign(userOp.hash(entryPoint, chainId))
      )

      const userOpHash = await ctx.provider.waallet.request<HexString>({
        method: WaalletRpcMethod.eth_sendUserOperation,
        params: [userOp.unwrap(), entryPoint]
      })
      await bundler.wait(userOpHash)

      const counterAfter = (await counter.number()) as bigint
      expect(counterAfter - counterBefore).toBe(1n)

      const counterBalanceAfter = await node.getBalance(
        await counter.getAddress()
      )
      expect(counterBalanceAfter - counterBalanceBefore).toBe(1n)
    })
  }
})
