import type {
  UserOperationDataV0_6,
  UserOperationDataV0_7
} from "~packages/bundler/userOperation"
import type { Unwraplify } from "~packages/primitive"
import type {
  BigNumberish,
  BytesLike,
  HexString,
  Nullable,
  OptionalPick
} from "~typing"

export enum WaalletRpcMethod {
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas",
  eth_estimateUserOperationGas = "eth_estimateUserOperationGas",
  eth_requestAccounts = "eth_requestAccounts",
  eth_sendTransaction = "eth_sendTransaction",
  eth_sendUserOperation = "eth_sendUserOperation",
  eth_signTypedData_v4 = "eth_signTypedData_v4",

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
  | EthSignTypedDataV4
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

export type EthSendUserOperationArguments = {
  method: WaalletRpcMethod.eth_sendUserOperation
  params: [
    UserOperationDataV0_6 | UserOperationDataV0_7,
    HexString // EntryPoint address
  ]
}

/* EIP-712 */

export type EthSignTypedDataV4 = {
  method: WaalletRpcMethod.eth_signTypedData_v4
  params: [
    HexString, // signer address
    {
      /**
       * Define data structs for `domain` and `message`.
       */
      types: Eip712Types

      /**
       *  https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
       */
      domain: Eip712Domain

      /**
       * Name of a type in `types` that describes the struct of `message`.
       */
      primaryType: string

      /**
       * Data for the struct of `primaryType`.
       */
      message: Record<string, any>
    }
  ]
}

export type Eip712Domain = {
  name?: Nullable<string>
  version?: Nullable<string>
  chainId?: Nullable<BigNumberish>
  verifyingContract?: Nullable<HexString>
  salt?: Nullable<BytesLike>
}

export type Eip712Types = Record<string, Eip712Type[]>

export type Eip712Type = {
  name: string
  type: string
}
