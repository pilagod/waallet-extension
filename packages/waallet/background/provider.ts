import type { AccountManager } from "~packages/account/manager"
import { BundlerRpcMethod } from "~packages/bundler/rpc"
import { GasPriceEstimator } from "~packages/gas/price/estimator"
import type { NetworkManager } from "~packages/network/manager"
import { Address, unwrapDeep } from "~packages/primitive"
import { JsonRpcProvider } from "~packages/rpc/json/provider"
import number from "~packages/util/number"
import type { HexString } from "~typing"

import {
  WaalletRpcMethod,
  type EthEstimateGasArguments,
  type EthEstimateUserOperationGasArguments,
  type EthSendTransactionArguments,
  type EthSendUserOperationArguments,
  type EthSignTypedDataV4,
  type WaalletRequestArguments,
  type WaalletRequestArgumentsUnwrappable
} from "../rpc"
import {
  Eip712Request,
  TransactionRequest,
  type RequestPool
} from "./pool/request"

export type WaalletBackgroundProviderOption = {
  accountManager?: AccountManager
  networkManager?: NetworkManager
  requestPool?: RequestPool
}

export class WaalletBackgroundProvider {
  public constructor(
    public accountManager: AccountManager,
    public networkManager: NetworkManager,
    public requestPool: RequestPool
  ) {}

  public clone(option: WaalletBackgroundProviderOption = {}) {
    const provider = new WaalletBackgroundProvider(
      option.accountManager ?? this.accountManager,
      option.networkManager ?? this.networkManager,
      option.requestPool ?? this.requestPool
    )
    return provider
  }

  public async request<T>(
    args: WaalletRequestArgumentsUnwrappable
  ): Promise<T> {
    if ("params" in args) {
      ;(args.params as any[]) = args.params.map(unwrapDeep)
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
        return [(await account.getAddress()).unwrap()]
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
      case WaalletRpcMethod.eth_signTypedData_v4:
        return this.handleSignTypedDataV4(args.params)
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
    if (tx.from && !(await account.getAddress()).isEqual(tx.from)) {
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
    if (tx.from && !(await account.getAddress()).isEqual(tx.from)) {
      throw new Error("Address `from` doesn't match connected account")
    }

    const entryPoint = await account.getEntryPoint()
    if (!bundler.isSupportedEntryPoint(entryPoint)) {
      throw new Error(`Unsupported EntryPoint ${entryPoint}`)
    }

    const txId = await this.requestPool.send({
      request: new TransactionRequest({
        ...tx,
        to: tx.to,
        gasLimit: tx.gas
      }),
      accountId,
      networkId
    })
    const transactionHash = await this.requestPool.wait(txId)

    return transactionHash
  }

  private async handleSignTypedDataV4(params: EthSignTypedDataV4["params"]) {
    const [signer, typedData] = params

    const { id: networkId } = this.networkManager.getActive()
    const { id: accountId, account } = await this.accountManager.getActive()
    if (!(await account.getAddress()).isEqual(signer)) {
      throw new Error("Signer address doesn't match connected account")
    }

    const requestId = await this.requestPool.send({
      request: new Eip712Request(typedData),
      accountId,
      networkId
    })
    const signature = await this.requestPool.wait(requestId)

    return signature
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
