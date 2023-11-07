import type { BigNumberish, BytesLike } from "ethers"

export enum Method {
  eth_accounts = "eth_accounts",
  eth_blockNumber = "eth_blockNumber",
  eth_chainId = "eth_chainId",
  eth_estimateGas = "eth_estimateGas"
}

export type RequestArguments =
  | EthEstimateGasArguments
  | {
      method: Method.eth_accounts | Method.eth_blockNumber | Method.eth_chainId
    }

type EthEstimateGasArguments = {
  method: Method.eth_estimateGas
  params: [
    {
      from?: BytesLike
      to: BytesLike
      gas?: BigNumberish
      gasPrice?: BigNumberish
      value?: BigNumberish
      input?: BytesLike
    }
  ]
}
