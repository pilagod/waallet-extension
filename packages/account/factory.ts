import { Address } from "~packages/primitive"
import type { HexString } from "~typing"

export interface AccountFactory {
  getAddress(): Promise<Address>
  getEntryPoint(): Promise<Address>
  getInitCode(): Promise<HexString>
}
