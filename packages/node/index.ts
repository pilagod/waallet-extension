import * as ethers from "ethers"

export type ContractRunner = ethers.ContractRunner

export function connect<T extends ethers.Contract>(
  contract: T,
  runner: ContractRunner
): T {
  return contract.connect(runner) as T
}
