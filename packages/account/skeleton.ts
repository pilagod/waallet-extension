import * as ethers from "ethers"

import type { Account, Call } from "~packages/account"
import type { AccountFactory } from "~packages/account/factory"
import { UserOperation } from "~packages/bundler"
import type { NetworkContext } from "~packages/context/network"
import type { BigNumberish, BytesLike, HexString } from "~typing"

export abstract class AccountSkeleton<T extends AccountFactory>
  implements Account
{
  protected address: HexString
  protected factory?: T

  protected constructor(opts: { address: HexString; factory?: T }) {
    this.address = ethers.getAddress(opts.address)
    this.factory = opts.factory
  }

  /* abstract */

  public abstract sign(message: BytesLike): Promise<HexString>
  protected abstract getCallData(call: Call): Promise<HexString>
  protected abstract getDummySignature(): Promise<HexString>
  protected abstract getNonce(ctx: NetworkContext): Promise<BigNumberish>

  /* public */

  public async createUserOperation(
    ctx: NetworkContext,
    call: Call
  ): Promise<UserOperation> {
    const isDeployed = await this.isDeployed(ctx)

    const sender = await this.getAddress()
    const nonce = call?.nonce ?? (isDeployed ? await this.getNonce(ctx) : 0)
    const initCode = isDeployed
      ? "0x"
      : await this.mustGetFactory().getInitCode()
    const callData = call ? await this.getCallData(call) : "0x"
    const signature = await this.getDummySignature()

    return new UserOperation({
      sender,
      nonce,
      initCode,
      callData,
      signature
    })
  }

  public async getAddress(): Promise<HexString> {
    return this.address
  }

  public async isDeployed(ctx: NetworkContext): Promise<boolean> {
    // TODO: Cache it
    const code = await ctx.node.getCode(await this.getAddress())
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
