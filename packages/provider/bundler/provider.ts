import type { HexString, Nullable } from "~typings"

import { Method } from "../rpc"
import { RpcProvider } from "../rpc/provider"

export enum BundlerMode {
  Manual = "manual",
  Auto = "auto"
}

export class BundlerProvider extends RpcProvider {
  public constructor(
    bundlerRpcUrl: string,
    private mode: BundlerMode = BundlerMode.Auto
  ) {
    super(bundlerRpcUrl)
  }

  public async wait(userOpHash: HexString): Promise<HexString> {
    if (this.mode === BundlerMode.Manual) {
      await this.debugSendBundleNow()
    }
    while (true) {
      const res = await new Promise<
        Nullable<{
          transactionHash: HexString
        }>
      >((resolve) => {
        setTimeout(async () => {
          resolve(
            await this.rpcRequest({
              method: Method.eth_getUserOperationByHash,
              params: [userOpHash]
            })
          )
        }, 1000)
      })
      if (res) {
        return res.transactionHash
      }
    }
  }

  private async debugSendBundleNow() {
    await this.rpcRequest({
      method: Method.debug_bundler_sendBundleNow
    })
  }
}
