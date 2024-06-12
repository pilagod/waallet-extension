import type { AccountManager } from "~packages/account/manager"
import { BundlerRpcMethod } from "~packages/bundler/rpc"
import { UserOperationV0_6 } from "~packages/bundler/userOperation/v0_6"
import type { NetworkManager } from "~packages/network/manager"
import { JsonRpcProvider } from "~packages/rpc/json/provider"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { HexString } from "~typing"

import {
  WaalletRpcMethod,
  type EthEstimateGasArguments,
  type EthEstimateUserOperationGasArguments,
  type EthSendTransactionArguments,
  type WaalletRequestArguments
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

  public async request<T>(args: WaalletRequestArguments): Promise<T> {
    console.log(args)
    const { bundler, node } = this.networkManager.getActive()
    switch (args.method) {
      case WaalletRpcMethod.eth_accounts:
      case WaalletRpcMethod.eth_requestAccounts:
        const { account } = await this.accountManager.getActive()
        return [await account.getAddress()] as T
      case WaalletRpcMethod.eth_chainId:
        return number.toHex(await bundler.getChainId()) as T
      case WaalletRpcMethod.eth_estimateGas:
        return this.handleEstimateGas(args.params) as T
      case WaalletRpcMethod.eth_estimateUserOperationGas:
        return this.handleEstimateUserOperationGas(args.params) as T
      case WaalletRpcMethod.eth_sendTransaction:
        return this.handleSendTransaction(args.params) as T
      case WaalletRpcMethod.eth_sendUserOperation:
        return bundler.sendUserOperation(
          new UserOperationV0_6(args.params[0]),
          args.params[1]
        ) as T
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
    if (tx.from && !address.isEqual(tx.from, await account.getAddress())) {
      throw new Error("Address `from` doesn't match connected account")
    }
    const { bundler } = this.networkManager.getActive()
    const entryPoint = await account.getEntryPoint()
    if (!bundler.isSupportedEntryPoint(entryPoint)) {
      throw new Error(`Unsupported EntryPoint ${entryPoint}`)
    }
    const userOp = new UserOperationV0_6(
      await account.createUserOperationCall({
        to: tx.to,
        value: tx.value,
        data: tx.data
      })
    )
    if (tx.gas) {
      userOp.setCallGasLimit(tx.gas)
    }
    const { callGasLimit } = await bundler.estimateUserOperationGas(
      userOp,
      entryPoint
    )
    return number.toHex(callGasLimit)
  }

  private async handleEstimateUserOperationGas(
    params: EthEstimateUserOperationGasArguments["params"]
  ): Promise<{
    preVerificationGas: HexString
    verificationGasLimit: HexString
    callGasLimit: HexString
  }> {
    const [userOpData, entryPoint] = params
    const userOp = new UserOperationV0_6(userOpData)
    const { bundler } = this.networkManager.getActive()
    if (!bundler.isSupportedEntryPoint(entryPoint)) {
      throw new Error(`Unsupported EntryPoint ${entryPoint}`)
    }
    const data = await bundler.estimateUserOperationGas(userOp, entryPoint)
    return {
      preVerificationGas: number.toHex(data.preVerificationGas),
      verificationGasLimit: number.toHex(data.verificationGasLimit),
      callGasLimit: number.toHex(data.callGasLimit)
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
    if (tx.from && !address.isEqual(tx.from, await account.getAddress())) {
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
}
