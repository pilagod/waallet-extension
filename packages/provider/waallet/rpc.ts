import {
  EthEstimateGas,
  EthSendTransaction
} from "packages/provider/waallet/background"

import { UserOperation } from "~packages/provider/bundler"
import type { BigNumberish, HexString, OptionalPick } from "~typing"

export enum WaalletRpcMethod {
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas",
  eth_estimateUserOperationGas = "eth_estimateUserOperationGas",
  eth_requestAccounts = "eth_requestAccounts",
  eth_sendTransaction = "eth_sendTransaction"
}

export type WaalletRequestArguments =
  | EthEstimateGasArguments
  | EthEstimateUserOperationGasArguments
  | EthSendTransactionArguments
  | {
      method:
        | WaalletRpcMethod.eth_accounts
        | WaalletRpcMethod.eth_blockNumber
        | WaalletRpcMethod.eth_chainId
        | WaalletRpcMethod.eth_requestAccounts
    }

export type EthEstimateGasArguments = {
  method: WaalletRpcMethod.eth_estimateGas
  params: [ReturnType<EthEstimateGas["params"]>]
}

export type EthEstimateUserOperationGasArguments = {
  method: WaalletRpcMethod.eth_estimateUserOperationGas
  params: [
    OptionalPick<
      ReturnType<UserOperation["data"]>,
      | "callGasLimit"
      | "verificationGasLimit"
      | "preVerificationGas"
      | "maxFeePerGas"
      | "maxPriorityFeePerGas"
    >
  ]
}

export type EthSendTransactionArguments = {
  method: WaalletRpcMethod.eth_sendTransaction
  params: [ReturnType<EthSendTransaction["params"]>]
}
