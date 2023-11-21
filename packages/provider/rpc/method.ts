import { type BigNumberish } from "ethers"

import type { HexString } from "~typings"

export enum Method {
  // Node
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas",
  eth_sendTransaction = "eth_sendTransaction",

  // Bundler
  debug_bundler_sendBundleNow = "debug_bundler_sendBundleNow",
  eth_estimateUserOperationGas = "eth_estimateUserOperationGas",
  eth_getUserOperationByHash = "eth_getUserOperationByHash",
  eth_sendUserOperation = "eth_sendUserOperation",
  eth_supportedEntryPoints = "eth_supportedEntryPoints"
}

export type RequestArguments =
  | EthEstimateGasArguments
  | EthEstimateUserOperationGasArguments
  | EthGetUserOperationByHash
  | EthSendTransactionArguments
  | EthSendUserOperationArguments
  | {
      method:
        | Method.debug_bundler_sendBundleNow
        | Method.eth_accounts
        | Method.eth_blockNumber
        | Method.eth_chainId
        | Method.eth_supportedEntryPoints
    }

/* Node */

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

/* Bundler */

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

export type EthGetUserOperationByHash = {
  method: Method.eth_getUserOperationByHash
  params: [HexString]
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

export type EthSendUserOperationArguments = {
  method: Method.eth_sendUserOperation
  params: [
    {
      sender: HexString
      nonce: BigNumberish
      initCode: HexString
      callData: HexString
      callGasLimit: BigNumberish
      verificationGasLimit: BigNumberish
      preVerificationGas: BigNumberish
      maxFeePerGas: BigNumberish
      maxPriorityFeePerGas: BigNumberish
      paymasterAndData: HexString
      signature: HexString
    },
    HexString
  ]
}
