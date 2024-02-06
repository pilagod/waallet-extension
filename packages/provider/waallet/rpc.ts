import type { UserOperation } from "~packages/provider/bundler"
import type { BigNumberish, HexString } from "~typing"

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
  params: [Partial<UserOperation>]
}

export type EthSendTransactionArguments = {
  method: WaalletRpcMethod.eth_sendTransaction
  params: [
    {
      from: HexString
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
