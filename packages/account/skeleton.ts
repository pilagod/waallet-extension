import * as ethers from "ethers"

import type { Account, Call, UserOperationCall } from "~packages/account"
import type { AccountFactory } from "~packages/account/factory"
import number from "~packages/util/number"
import type { BigNumberish, BytesLike, HexString } from "~typing"

export abstract class AccountSkeleton<T extends AccountFactory>
  implements Account
{
  protected node: ethers.JsonRpcProvider
  protected address: HexString
  protected factory?: T

  protected constructor(opts: {
    address: HexString
    factory?: T
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.address = opts.address
    this.factory = opts.factory
  }

  /* abstract */

  public abstract sign(message: BytesLike): Promise<HexString>
  protected abstract getCallData(call: Call): Promise<HexString>
  protected abstract getDummySignature(): Promise<HexString>
  protected abstract getNonce(): Promise<BigNumberish>

  /* public */

  public async createUserOperationCall(call: Call): Promise<UserOperationCall> {
    const isDeployed = await this.isDeployed()

    const sender = await this.getAddress()
    const nonce = call?.nonce ?? (isDeployed ? await this.getNonce() : 0)
    const initCode = isDeployed
      ? "0x"
      : await this.mustGetFactory().getInitCode()
    const callData = call ? await this.getCallData(call) : "0x"
    const signature = await this.getDummySignature()

    return {
      sender,
      nonce,
      initCode,
      callData,
      signature
    }
  }

  public async getAddress(): Promise<HexString> {
    return this.address
  }

  public async isDeployed(): Promise<boolean> {
    const code = await this.node.getCode(await this.getAddress())
    return code !== "0x"
  }

  /* protected */

  protected mustGetFactory() {
    if (!this.factory) {
      throw new Error("No factory")
    }
    return this.factory
  }
}
