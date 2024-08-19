import { verifyTypedData } from "ethers"

import { SimpleAccount } from "~packages/account/SimpleAccount"
import address from "~packages/util/address"
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

    it("should sign typed data", async () => {
      // Example from https://docs.metamask.io/wallet/reference/eth_signtypeddata_v4/
      const typedData = {
        types: {
          EIP712Domain: [
            {
              name: "name",
              type: "string"
            },
            {
              name: "version",
              type: "string"
            },
            {
              name: "chainId",
              type: "uint256"
            },
            {
              name: "verifyingContract",
              type: "address"
            }
          ],
          Person: [
            {
              name: "name",
              type: "string"
            },
            {
              name: "wallet",
              type: "address"
            }
          ],
          Mail: [
            {
              name: "from",
              type: "Person"
            },
            {
              name: "to",
              type: "Person"
            },
            {
              name: "contents",
              type: "string"
            }
          ]
        },
        primaryType: "Mail",
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        },
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          contents: "Hello, Bob!"
        }
      }

      const signature = await ctx.provider.waallet.request<HexString>({
        method: WaalletRpcMethod.eth_signTypedData_v4,
        params: [await ctx.account.getAddress(), typedData]
      })

      const { EIP712Domain, ...types } = typedData.types
      const signer = verifyTypedData(
        typedData.domain,
        types,
        typedData.message,
        signature
      )
      expect(
        address.isEqual(await ctx.wallet.operator.getAddress(), signer)
      ).toBe(true)
    })
  }
})
