import type {
  UserOperationDataV0_6,
  UserOperationDataV0_7
} from "~packages/bundler/userOperation"
import type { Unwraplify } from "~packages/primitive"
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

  custom_estimateGasPrice = "custom_estimateGasPrice"
}

export type WaalletRequestArgumentsUnwrappable<
  T extends WaalletRequestArguments = WaalletRequestArguments
> = T extends { params: infer P }
  ? Omit<T, "params"> & { params: Unwraplify<P> }
  : T

export type WaalletRequestArguments =
  | EthEstimateGasArguments
  | EthEstimateUserOperationGasArguments
  | EthSendTransactionArguments
  | EthSendUserOperationArguments
  | {
      method:
        | WaalletRpcMethod.eth_accounts
        | WaalletRpcMethod.eth_blockNumber
        | WaalletRpcMethod.eth_chainId
        | WaalletRpcMethod.eth_requestAccounts
        | WaalletRpcMethod.custom_estimateGasPrice
    }

export type EthTransaction = {
  from?: HexString
  to?: HexString
  gas?: BigNumberish
  gasPrice?: BigNumberish
  value?: BigNumberish
  data?: HexString
  input?: HexString
  nonce?: BigNumberish
}

export type EthEstimateGasArguments = {
  method: WaalletRpcMethod.eth_estimateGas
  params: [EthTransaction]
}

export type EthEstimateUserOperationGasArguments = {
  method: WaalletRpcMethod.eth_estimateUserOperationGas
  params: [
    (
      | OptionalPick<
          UserOperationDataV0_6,
          | "callGasLimit"
          | "verificationGasLimit"
          | "preVerificationGas"
          | "maxFeePerGas"
          | "maxPriorityFeePerGas"
        >
      | OptionalPick<
          UserOperationDataV0_7,
          | "callGasLimit"
          | "verificationGasLimit"
          | "preVerificationGas"
          | "maxFeePerGas"
          | "maxPriorityFeePerGas"
          | "paymasterVerificationGasLimit"
          | "paymasterPostOpGasLimit"
        >
    ),
    HexString // EntryPoint address
  ]
}

export type EthSendTransactionArguments = {
  method: WaalletRpcMethod.eth_sendTransaction
  params: [EthTransaction]
}

/**
 * @param UserOperation
 * @param EntryPoint address
 */
export type EthSendUserOperationArguments = {
  method: WaalletRpcMethod.eth_sendUserOperation
  params: [UserOperationDataV0_6 | UserOperationDataV0_7, HexString]
}
