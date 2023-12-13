import type { HexString } from "~typings"

export interface Account {
  getAddress(): Promise<HexString>
  getInitCode(): Promise<HexString>
  signMessage(message: string | Uint8Array): Promise<HexString>
}
