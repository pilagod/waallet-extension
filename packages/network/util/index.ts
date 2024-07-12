import { Contract, type ContractRunner } from "ethers"

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
  runner: ContractRunner
) => {
  return new Contract(
    address,
    [
      "function balanceOf(address account) external view returns (uint256)",
      "function transfer(address to, uint256 value) public returns (bool)",
      "function name() public view returns (string)",
      "function symbol() public view returns (string)",
      "function decimals() public view returns (uint8)"
    ],
    runner
  )
}
