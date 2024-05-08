import { type TransactionReceipt } from "web3-types"

import config from "~config/test"
import byte from "~packages/util/byte"
import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import type { HexString } from "~typing"

import { WaalletRpcMethod } from "../rpc"

describeWaalletSuite("WalletBackgroundProvider", (ctx) => {
  const { node } = config.networkManager.getActive()
  const { counter } = config.contract

  it("should get chain id", async () => {
    const chainId = await ctx.provider.request<HexString>({
      method: WaalletRpcMethod.eth_chainId
    })
    expect(parseInt(chainId, 16)).toBe(1337)
  })

  it("should get block number", async () => {
    const blockNumber = await ctx.provider.request<HexString>({
      method: WaalletRpcMethod.eth_blockNumber
    })
    expect(parseInt(blockNumber, 16)).toBeGreaterThan(0)
  })

  it("should get accounts", async () => {
    const accounts = await ctx.provider.request<HexString>({
      method: WaalletRpcMethod.eth_accounts
    })
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts[0]).toHaveLength(42)
  })

  it("should request accounts", async () => {
    const accounts = await ctx.provider.request<HexString>({
      method: WaalletRpcMethod.eth_requestAccounts
    })
    expect(accounts.length).toBeGreaterThan(0)
    expect(accounts[0]).toHaveLength(42)
  })

  it("should estimate gas", async () => {
    const gas = await ctx.provider.request<HexString>({
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

  it("should send transaction to contract", async () => {
    const balanceBefore = await node.getBalance(counter.getAddress())
    const counterBefore = (await counter.number()) as bigint

    const txHash = await ctx.provider.request<HexString>({
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
    const { bundler, node } = ctx.provider.networkManager.getActive()

    const counterBefore = (await counter.number()) as bigint
    const counterBalanceBefore = await node.getBalance(
      await counter.getAddress()
    )

    const userOp = await ctx.account.createUserOperation(node, {
      to: await counter.getAddress(),
      value: 1,
      data: counter.interface.encodeFunctionData("increment", [])
    })

    const { gasPrice } = await node.getFeeData()
    userOp.setGasFee({
      maxFeePerGas: gasPrice * 2n,
      maxPriorityFeePerGas: gasPrice * 2n
    })

    const [entryPointAddress] = await bundler.getSupportedEntryPoints()
    userOp.setGasLimit(
      await bundler.estimateUserOperationGas(userOp, entryPointAddress)
    )

    const chainId = await bundler.getChainId()
    userOp.setSignature(
      await ctx.account.sign(userOp.hash(entryPointAddress, chainId))
    )

    const userOpHash = await ctx.provider.request<HexString>({
      method: WaalletRpcMethod.eth_sendUserOperation,
      params: [userOp.data(), entryPointAddress]
    })
    await bundler.wait(userOpHash)

    const counterAfter = (await counter.number()) as bigint
    expect(counterAfter - counterBefore).toBe(1n)

    const counterBalanceAfter = await node.getBalance(
      await counter.getAddress()
    )
    expect(counterBalanceAfter - counterBalanceBefore).toBe(1n)
  })
})
