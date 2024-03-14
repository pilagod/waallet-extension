import type { ContractRunner } from "~packages/node"
import type { HexString } from "~typing"

export interface AccountFactory {
  getAddress(runner: ContractRunner): Promise<HexString>
  getInitCode(): Promise<HexString>
}
