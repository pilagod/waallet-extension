import * as ethers from "ethers"

import type { HexString } from "~typing"

export function getChainName(chain: string | number): string {
  const net = typeof chain === "string" ? chain.toLowerCase() : chain
  let chainName: string
  switch (net) {
    case "mainnet":
    case 1:
      chainName = "mainnet"
      break
    case "testnet":
    case 1337:
      chainName = "testnet"
      break
    case "sepolia":
    case 11155111:
      chainName = "sepolia"
      break
    default:
      chainName = null
  }
  return chainName
}

export const getErc20Contract = (
  address: HexString,
  runner: ethers.ContractRunner
) => {
  return new ethers.Contract(
    address,
    [
      "function balanceOf(address account) external view returns (uint256)",
      "function name() public view returns (string)",
      "function symbol() public view returns (string)",
      "function decimals() public view returns (uint8)"
    ],
    runner
  )
}
