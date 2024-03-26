import * as ethers from "ethers"

import type { Account, Call } from "~packages/account"
import type { AccountFactory } from "~packages/account/factory"
import { UserOperation } from "~packages/bundler"
import type { ContractRunner } from "~packages/node"
import type { BytesLike, HexString } from "~typing"

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

  /* public */

  public async createUserOperation(
    runner: ContractRunner,
    call: Call
  ): Promise<UserOperation> {
    const isDeployed = await this.isDeployed(runner)

    const sender = await this.getAddress()
    const nonce = call?.nonce ?? (isDeployed ? await this.getNonce(runner) : 0)
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

  public async isDeployed(runner: ContractRunner): Promise<boolean> {
    // TODO: Cache it
    const code = await runner.provider.getCode(await this.getAddress())
    return code !== "0x"
  }

  /* protected */

  protected mustGetFactory() {
    if (!this.factory) {
      throw new Error("No factory")
    }
    return this.factory
  }

  protected async getNonce(runner: ContractRunner): Promise<bigint> {
    const account = new ethers.Contract(
      this.address,
      [
        "function entryPoint() view returns (address)",
        "function getEntryPoint() view returns (address)"
      ],
      runner
    )
    const entryPoint = new ethers.Contract(
      await (() => {
        try {
          return account.entryPoint()
        } catch (e) {
          return account.getEntryPoint()
        }
      })(),
      [
        "function getNonce(address sender, uint192 key) view returns (uint256 nonce)"
      ],
      runner
    )
    return entryPoint.getNonce(this.address, 0)
  }
}
