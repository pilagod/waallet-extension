import type { HexString } from "~typing"

export interface AccountFactory {
  getAddress(): Promise<HexString>
  getEntryPoint(): Promise<HexString>
  getInitCode(): Promise<HexString>
}
