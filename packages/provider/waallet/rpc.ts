import type { BigNumberish, HexString } from "~typings"

export enum WaalletRpcMethod {
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas",
  eth_sendTransaction = "eth_sendTransaction"
}

export type WaalletRequestArguments =
  | EthEstimateGasArguments
  | EthSendTransactionArguments
  | {
      method:
        | WaalletRpcMethod.eth_accounts
        | WaalletRpcMethod.eth_blockNumber
        | WaalletRpcMethod.eth_chainId
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
      input?: HexString
    }
  ]
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
      nonce?: BigNumberish
    }
  ]
}
