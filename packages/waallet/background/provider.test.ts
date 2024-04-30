import { type TransactionReceipt } from "web3-types"

import config from "~config/test"
import { UserOperation } from "~packages/bundler"
import { BundlerRpcMethod } from "~packages/bundler/rpc"
import byte from "~packages/util/byte"
import { describeWaalletSuite } from "~packages/util/testing/suite/waallet"
import { UserOperationSender } from "~packages/waallet/background/pool/userOperation/sender"
import type { HexString, Nullable } from "~typing"

import { WaalletRpcMethod } from "../rpc"
import {
  type UserOperationAuthorizeCallback,
  type UserOperationAuthorizer
} from "./authorizer/userOperation"

describeWaalletSuite("WalletBackgroundProvider", (ctx) => {
  const { bundler, node } = config.networkManager.getActive()
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

  // TODO: This test is for UserOperationSender
  it("should send authorized user operation", async () => {
    const mutatingAuthorizer = new (class MutatingUserOperationAuthorizer
      implements UserOperationAuthorizer
    {
      public userOpAuthorized: Nullable<UserOperation> = null

      public async authorize(
        userOp: UserOperation,
        { onApproved }: UserOperationAuthorizeCallback
      ) {
        userOp.setCallGasLimit(userOp.callGasLimit + 1n)
        this.userOpAuthorized = await onApproved(userOp)
        return this.userOpAuthorized
      }
    })()

    const mutatingProvider = ctx.provider.clone({
      userOperationPool: new UserOperationSender(
        ctx.provider.accountManager,
        ctx.provider.networkManager,
        mutatingAuthorizer
      )
    })
    await mutatingProvider.request({
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          to: await counter.getAddress(),
          value: 1
        }
      ]
    })

    const userAuthorizedOpHash = mutatingAuthorizer.userOpAuthorized.hash(
      (await bundler.getSupportedEntryPoints())[0],
      await bundler.getChainId()
    )
    const data = await bundler.getUserOperationByHash(userAuthorizedOpHash)

    expect(data).not.toBe(null)
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

  it("should get user operation and transaction receipt by hash", async () => {
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
    const txHash = await bundler.wait(userOpHash)

    const counterBalanceAfter = await node.getBalance(
      await counter.getAddress()
    )
    expect(counterBalanceAfter - counterBalanceBefore).toBe(1n)

    const userOpStmt = await ctx.provider.request<
      Nullable<{
        userOperation: UserOperation
        entryPoint: HexString
        blockNumber: bigint
        blockHash: HexString
        transactionHash: HexString
      }>
    >({
      method: BundlerRpcMethod.eth_getUserOperationByHash,
      params: [userOpHash]
    })
    expect(userOpStmt.userOperation).toMatchObject(userOp.data())
    expect(userOpStmt.transactionHash).toBe(txHash)

    const txReceipt = await ctx.provider.request<Nullable<TransactionReceipt>>({
      method: "eth_getTransactionReceipt",
      params: [txHash]
    })
    expect(txReceipt.to.toLowerCase()).toBe(userOpStmt.entryPoint.toLowerCase())
    expect(txReceipt.blockHash).toBe(userOpStmt.blockHash)
    expect(txReceipt.blockNumber).toBe(userOpStmt.blockNumber)
    expect(txReceipt.status).toBe("0x1") // '1' indicates a success, '0' indicates a revert

    const userOpReceipt = await ctx.provider.request<Nullable<any>>({
      method: BundlerRpcMethod.eth_getUserOperationReceipt,
      params: [userOpHash]
    })
    const txReceiptFromUserOpReceipt =
      userOpReceipt.receipt as TransactionReceipt
    expect(txReceipt).toMatchObject(txReceiptFromUserOpReceipt)
  })
})
