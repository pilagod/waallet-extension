import { type BigNumberish } from "ethers"

import type { HexString } from "~typing"

export enum Method {
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas",

  // Bundler
  eth_estimateUserOperationGas = "eth_estimateUserOperationGas",
  eth_supportedEntryPoints = "eth_supportedEntryPoints"
}

export type RequestArguments =
  | EthEstimateGasArguments
  | EthEstimateUserOperationGasArguments
  | {
      method:
        | Method.eth_accounts
        | Method.eth_blockNumber
        | Method.eth_chainId
        | Method.eth_supportedEntryPoints
    }

export type EthEstimateGasArguments = {
  method: Method.eth_estimateGas
  params: [
    {
      from?: HexString
      to: HexString
      gas?: BigNumberish
      gasPrice?: BigNumberish
      value?: BigNumberish
      input?: HexString
    }
  ]
}

export type EthEstimateUserOperationGasArguments = {
  method: Method.eth_estimateUserOperationGas
  params: [
    {
      sender: HexString
      nonce: BigNumberish
      initCode: HexString
      callData: HexString
      callGasLimit?: BigNumberish
      verificationGasLimit?: BigNumberish
      preVerificationGas?: BigNumberish
      maxFeePerGas?: BigNumberish
      maxPriorityFeePerGas?: BigNumberish
      paymasterAndData?: HexString
      signature?: HexString
    },
    HexString
  ]
}
