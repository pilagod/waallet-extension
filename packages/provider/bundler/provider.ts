import type { HexString, Nullable } from "~typings"

import { Method, request } from "../rpc"

export enum BundlerMode {
  Manual = "manual",
  Auto = "auto"
}

export class BundlerProvider {
  public constructor(
    private bundlerRpcUrl: string,
    private mode: BundlerMode = BundlerMode.Auto
  ) {}

  public get rpcUrl() {
    return this.bundlerRpcUrl
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
            await request(this.bundlerRpcUrl, {
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
    await request(this.bundlerRpcUrl, {
      method: Method.debug_bundler_sendBundleNow
    })
  }
}
