import { type BigNumberish } from "ethers"

import type { HexString } from "~typings"

export enum Method {
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas",
  eth_sendTransaction = "eth_sendTransaction"
}

export type RequestArguments =
  | EthEstimateGasArguments
  | EthSendTransactionArguments
  | {
      method: Method.eth_accounts | Method.eth_blockNumber | Method.eth_chainId
    }

export type EthEstimateGasArguments = {
  method: Method.eth_estimateGas
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
  method: Method.eth_sendTransaction
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
