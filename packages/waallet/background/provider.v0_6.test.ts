import { UserOperationV0_6 } from "~packages/bundler/userOperation/v0_6"
import byte from "~packages/util/byte"
import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { HexString } from "~typing"

describeWaalletSuite({
  name: "WalletBackgroundProvider",
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
        contract: { counter }
      } = ctx

      const userOp = new UserOperationV0_6(
        await ctx.account.createUserOperationCall({
          to: await counter.getAddress(),
          value: 1,
          data: counter.interface.encodeFunctionData("increment", [])
        })
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
          params: [userOp.data(), await ctx.account.getEntryPoint()]
        })

      await expect(useInvalidNonce()).rejects.toThrow()
    })

    it("should send transaction to contract", async () => {
      await ctx.topupAccount()

      const {
        contract: { counter },
        provider: { node }
      } = ctx

      const balanceBefore = await node.getBalance(counter.getAddress())
      const counterBefore = (await counter.number()) as bigint

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

      const userOp = new UserOperationV0_6(
        await ctx.account.createUserOperationCall({
          to: await counter.getAddress(),
          value: 1,
          data: counter.interface.encodeFunctionData("increment", [])
        })
      )

      const { gasPrice } = await node.getFeeData()
      userOp.setGasFee({
        maxFeePerGas: gasPrice * 2n,
        maxPriorityFeePerGas: gasPrice * 2n
      })

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
        params: [userOp.data(), entryPoint]
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
