import type { AccountManager } from "~packages/account/manager"
import { BundlerRpcMethod } from "~packages/bundler/rpc"
import { GasPriceEstimator } from "~packages/gas/price/estimator"
import type { NetworkManager } from "~packages/network/manager"
import { Address, unwrap } from "~packages/primitive"
import { JsonRpcProvider } from "~packages/rpc/json/provider"
import number from "~packages/util/number"
import type { HexString } from "~typing"

import {
  WaalletRpcMethod,
  type EthEstimateGasArguments,
  type EthEstimateUserOperationGasArguments,
  type EthSendTransactionArguments,
  type EthSendUserOperationArguments,
  type WaalletRequestArguments,
  type WaalletRequestArgumentsUnwrappable
} from "../rpc"
import { Transaction, type TransactionPool } from "./pool/transaction"

export type WaalletBackgroundProviderOption = {
  accountManager?: AccountManager
  networkManager?: NetworkManager
  transactionPool?: TransactionPool
}

export class WaalletBackgroundProvider {
  public constructor(
    public accountManager: AccountManager,
    public networkManager: NetworkManager,
    public transactionPool: TransactionPool
  ) {}

  public clone(option: WaalletBackgroundProviderOption = {}) {
    const provider = new WaalletBackgroundProvider(
      option.accountManager ?? this.accountManager,
      option.networkManager ?? this.networkManager,
      option.transactionPool ?? this.transactionPool
    )
    return provider
  }

  public async request<T>(
    args: WaalletRequestArgumentsUnwrappable
  ): Promise<T> {
    if ("params" in args) {
      ;(args.params as any[]) = args.params.map(unwrap)
    }
    return this.handleRequest(args as WaalletRequestArguments) as T
  }

  private async handleRequest(args: WaalletRequestArguments) {
    console.log(args)
    const { node, bundler } = this.networkManager.getActive()
    switch (args.method) {
      case WaalletRpcMethod.eth_accounts:
      case WaalletRpcMethod.eth_requestAccounts: {
        const { account } = await this.accountManager.getActive()
        return [account.getAddress().unwrap()]
      }
      case WaalletRpcMethod.eth_chainId:
        return number.toHex(await bundler.getChainId())
      case WaalletRpcMethod.eth_estimateGas:
        return this.handleEstimateGas(args.params)
      case WaalletRpcMethod.eth_estimateUserOperationGas:
        return this.handleEstimateUserOperationGas(args.params)
      case WaalletRpcMethod.eth_sendTransaction:
        return this.handleSendTransaction(args.params)
      case WaalletRpcMethod.eth_sendUserOperation:
        return this.handleSendUserOperation(args.params)
      case WaalletRpcMethod.custom_estimateGasPrice:
        return this.handleEstimateGasPrice()
      // TODO: Need split the RequestArgs to NodeRequestArgs | BundlerRequestArgs
      default:
        if (args.method in BundlerRpcMethod) {
          return new JsonRpcProvider(bundler.url).send(args)
        }
        return new JsonRpcProvider(node.url).send(args)
    }
  }

  private async handleEstimateGas(
    params: EthEstimateGasArguments["params"]
  ): Promise<HexString> {
    const [tx] = params
    if (!tx.to) {
      // TODO: When `to` is empty, it should estimate gas for contract creation
      return
    }
    const { account } = await this.accountManager.getActive()
    if (tx.from && !account.getAddress().isEqual(tx.from)) {
      throw new Error("Address `from` doesn't match connected account")
    }
    const { bundler } = this.networkManager.getActive()
    const entryPoint = await account.getEntryPoint()
    if (!bundler.isSupportedEntryPoint(entryPoint)) {
      throw new Error(`Unsupported EntryPoint ${entryPoint}`)
    }
    const userOp = bundler.deriveUserOperation(
      await account.buildExecution({
        to: tx.to,
        value: tx.value,
        data: tx.data
      }),
      entryPoint
    )
    if (tx.gas) {
      userOp.setGasLimit({ callGasLimit: tx.gas })
    }
    const { callGasLimit } = await bundler.estimateUserOperationGas(
      userOp,
      entryPoint
    )
    return number.toHex(callGasLimit)
  }

  private async handleEstimateGasPrice() {
    const { node, bundler } = this.networkManager.getActive()
    const gasPriceEstimator = new GasPriceEstimator(node, bundler)
    const gasPrice = await gasPriceEstimator.estimate()
    return {
      maxFeePerGas: number.toHex(gasPrice.maxFeePerGas),
      maxPriorityFeePerGas: number.toHex(gasPrice.maxPriorityFeePerGas)
    }
  }

  private async handleEstimateUserOperationGas(
    params: EthEstimateUserOperationGasArguments["params"]
  ): Promise<{
    preVerificationGas: HexString
    verificationGasLimit: HexString
    callGasLimit: HexString
    paymasterVerificationGasLimit: HexString
  }> {
    const [userOp, entryPointAddress] = params
    const entryPoint = Address.wrap(entryPointAddress)
    const { bundler } = this.networkManager.getActive()
    if (!bundler.isSupportedEntryPoint(entryPoint)) {
      throw new Error(`Unsupported EntryPoint ${entryPoint}`)
    }
    const data = await bundler.estimateUserOperationGas(
      bundler.deriveUserOperation(userOp, entryPoint),
      entryPoint
    )
    return {
      preVerificationGas: number.toHex(data.preVerificationGas),
      verificationGasLimit: number.toHex(data.verificationGasLimit),
      callGasLimit: number.toHex(data.callGasLimit),
      paymasterVerificationGasLimit: number.toHex(
        data.paymasterVerificationGasLimit ?? 0n
      )
    }
  }

  private async handleSendTransaction(
    params: EthSendTransactionArguments["params"]
  ): Promise<HexString> {
    const [tx] = params

    // TODO: When `to` is empty, it should create contract
    if (!tx.to) {
      return
    }

    const { id: networkId, bundler } = this.networkManager.getActive()
    const { id: accountId, account } = await this.accountManager.getActive()
    if (tx.from && !account.getAddress().isEqual(tx.from)) {
      throw new Error("Address `from` doesn't match connected account")
    }

    const entryPoint = await account.getEntryPoint()
    if (!bundler.isSupportedEntryPoint(entryPoint)) {
      throw new Error(`Unsupported EntryPoint ${entryPoint}`)
    }

    const txId = await this.transactionPool.send({
      tx: new Transaction({
        ...tx,
        to: tx.to,
        gasLimit: tx.gas
      }),
      senderId: accountId,
      networkId
    })
    const transactionHash = await this.transactionPool.wait(txId)

    return transactionHash
  }

  private async handleSendUserOperation(
    params: EthSendUserOperationArguments["params"]
  ): Promise<HexString> {
    const [userOp, entryPointAddress] = params
    const entryPoint = Address.wrap(entryPointAddress)
    const { bundler } = this.networkManager.getActive()
    return bundler.sendUserOperation(
      bundler.deriveUserOperation(userOp, entryPoint),
      entryPoint
    )
  }
}
