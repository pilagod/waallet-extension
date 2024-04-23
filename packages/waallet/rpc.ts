import { type UserOperationData } from "~packages/bundler"
import type { BigNumberish, HexString, OptionalPick } from "~typing"

export enum WaalletRpcMethod {
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas",
  eth_estimateUserOperationGas = "eth_estimateUserOperationGas",
  eth_requestAccounts = "eth_requestAccounts",
  eth_sendTransaction = "eth_sendTransaction",
  eth_sendUserOperation = "eth_sendUserOperation",
  eth_getStatusByTransactionHash = "eth_getStatusByTransactionHash",
  eth_getTransactionHashByUserOperationHash = "eth_getTransactionHashByUserOperationHash"
}

export type WaalletRequestArguments =
  | EthEstimateGasArguments
  | EthEstimateUserOperationGasArguments
  | EthSendTransactionArguments
  | EthSendUserOperationArguments
  | EthGetStatusByTransactionHashArguments
  | EthGetTransactionHashByUserOperationHashArguments
  | {
      method:
        | WaalletRpcMethod.eth_accounts
        | WaalletRpcMethod.eth_blockNumber
        | WaalletRpcMethod.eth_chainId
        | WaalletRpcMethod.eth_requestAccounts
    }

export type EthEstimateGasArguments = {
  method: WaalletRpcMethod.eth_estimateGas
  params: [
    {
      from?: HexString
      to?: HexString
      gas?: BigNumberish
      gasPrice?: BigNumberish
      value?: BigNumberish
      data?: HexString
    }
  ]
}

export type EthEstimateUserOperationGasArguments = {
  method: WaalletRpcMethod.eth_estimateUserOperationGas
  params: [
    OptionalPick<
      UserOperationData,
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
  params: [
    {
      from?: HexString
      to?: HexString
      gas?: BigNumberish
      gasPrice?: BigNumberish
      value?: BigNumberish
      input?: HexString
      data?: HexString
      nonce?: BigNumberish
    }
  ]
}

/**
 * @param UserOperation
 * @param EntryPoint address
 */
export type EthSendUserOperationArguments = {
  method: WaalletRpcMethod.eth_sendUserOperation
  params: [UserOperationData, HexString]
}

export type EthGetStatusByTransactionHashArguments = {
  method: WaalletRpcMethod.eth_getStatusByTransactionHash
  params: [HexString]
}

export type EthGetTransactionHashByUserOperationHashArguments = {
  method: WaalletRpcMethod.eth_getTransactionHashByUserOperationHash
  params: [HexString]
}
