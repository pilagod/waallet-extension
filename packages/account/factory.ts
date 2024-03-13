import type { NetworkContext } from "~packages/context/network"
import type { HexString } from "~typing"

export interface AccountFactory {
  getAddress(ctx: NetworkContext): Promise<HexString>
  getInitCode(): Promise<HexString>
}
