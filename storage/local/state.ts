import { AccountType } from "~packages/account"
import { EntryPointVersion } from "~packages/bundler"
import type {
  UserOperationDataV0_6,
  UserOperationDataV0_7
} from "~packages/bundler/userOperation"
import type { Eip712TypedData } from "~packages/eip/712"
import { type Token } from "~packages/token"
import type { B64UrlString, HexString, Nullable } from "~typing"

/* State */

export type State = {
  networkActive: string
  network: {
    [id: string]: Network
  }
  account: {
    [id: string]: Account
  }
  paymaster: {
    [id: string]: Paymaster
  }
  pendingRequests: Record<string, Request>
}

/* Netowork */

export type Network = {
  id: string
  chainId: number
  name: string
  nodeRpcUrl: string
  bundlerRpcUrl: string
  accountActive: Nullable<HexString>
  entryPoint: {
    [v in EntryPointVersion]: HexString
  }
  accountFactory: {
    [type in AccountType]: HexString
  }
}

/* Account */

export type Account = SimpleAccount | PasskeyAccount

export type AccountToken = Token & {
  balance: HexString
}

export type AccountMeta<T> = {
  id: string
  name: string
  transactionLog: {
    [txId: string]: TransactionLog
  }
  balance: HexString
  tokens: AccountToken[]
} & T

export type SimpleAccount = AccountMeta<{
  type: AccountType.SimpleAccount
  chainId: number
  address: HexString
  ownerPrivateKey: HexString
}>

export type PasskeyAccount = AccountMeta<{
  type: AccountType.PasskeyAccount
  chainId: number
  address: HexString
  credentialId: B64UrlString
  publicKey?: {
    x: HexString
    y: HexString
  }
  factoryAddress?: HexString
  salt?: HexString
}>

/* Paymaster */

export enum PaymasterType {
  VerifyingPaymaster = "VerifyingPaymaster"
}

export type Paymaster = VerifyingPaymaster

export type VerifyingPaymaster = {
  type: PaymasterType
  chainId: number
  address: HexString
  ownerPrivateKey: HexString
}

/* Request */

export enum RequestType {
  Transaction = "Transaction",
  Eip712 = "Eip712"
}

export type Request = TransactionRequest | Eip712Request

export type RequestMeta<T> = {
  id: string
  createdAt: number
  accountId: string
  networkId: string
} & T

export type TransactionRequest = RequestMeta<{
  type: RequestType.Transaction
  to: HexString
  value: HexString
  data: HexString
  nonce?: HexString
  gasLimit?: HexString
  gasPrice?: HexString
}>

export type Eip712Request = RequestMeta<
  {
    type: RequestType.Eip712
    signature?: HexString
  } & Eip712TypedData
>

/* Transaction */

export enum TransactionStatus {
  // User rejects the user operation.
  Rejected = "Rejected",
  // Bundler accepts the user operation.
  Sent = "Sent",
  // Bundler rejects the user operation.
  Failed = "Failed",
  // User operation is executed on chain.
  Succeeded = "Succeeded",
  // User opreation is reverted on chain.
  Reverted = "Reverted"
}

export enum TransactionType {
  ERC4337V0_6 = "ERC4337V0_6",
  ERC4337V0_7 = "ERC4337V0_7"
}

/* Transaction - Log */

export type TransactionLog = ERC4337TransactionLog

export type TransactionLogMeta<T> = {
  id: string
  accountId: string
  networkId: string
  createdAt: number
} & T

/* Transaction - ERC4337 */

export type ERC4337TransactionMeta<T> = TransactionLogMeta<
  | {
      type: TransactionType.ERC4337V0_6
      detail: {
        entryPoint: HexString
        data: UserOperationDataV0_6
      }
    }
  | {
      type: TransactionType.ERC4337V0_7
      detail: {
        entryPoint: HexString
        data: UserOperationDataV0_7
      }
    }
> &
  T

export type ERC4337TransactionLog =
  | ERC4337TransactionRejected
  | ERC4337TransactionSent
  | ERC4337TransactionFailed
  | ERC4337TransactionSucceeded
  | ERC4337TransactionReverted

export type ERC4337TransactionRejected = ERC4337TransactionMeta<{
  status: TransactionStatus.Rejected
}>

export type ERC4337TransactionSent = ERC4337TransactionMeta<{
  status: TransactionStatus.Sent
  receipt: {
    userOpHash: HexString
  }
}>

export type ERC4337TransactionFailed = ERC4337TransactionMeta<{
  status: TransactionStatus.Failed
  receipt: {
    userOpHash: HexString
    errorMessage: string
  }
}>

export type ERC4337TransactionSucceeded = ERC4337TransactionMeta<{
  status: TransactionStatus.Succeeded
  receipt: {
    userOpHash: HexString
    transactionHash: HexString
    blockHash: HexString
    blockNumber: HexString
  }
}>

export type ERC4337TransactionReverted = ERC4337TransactionMeta<{
  status: TransactionStatus.Reverted
  receipt: {
    userOpHash: HexString
    transactionHash: HexString
    blockHash: HexString
    blockNumber: HexString
    errorMessage: string
  }
}>
