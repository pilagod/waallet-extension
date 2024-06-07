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

  protected constructor(
    protected runner: ContractRunner,
    option: {
      address: HexString
      factory?: T
    }
  ) {
    this.address = ethers.getAddress(option.address)
    this.factory = option.factory
  }

  /* abstract */

  public abstract sign(message: BytesLike): Promise<HexString>
  protected abstract getCallData(call: Call): Promise<HexString>
  protected abstract getDummySignature(): Promise<HexString>

  /* public */

  public async createUserOperation(call: Call): Promise<UserOperation> {
    const sender = await this.getAddress()
    // Only nonce on chain can be used
    const nonce = await this.getNonce()
    const initCode = (await this.isDeployed())
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

  public async getNonce(): Promise<bigint> {
    if (!(await this.isDeployed())) {
      return 0n
    }
    const account = new ethers.Contract(
      this.address,
      [
        "function entryPoint() view returns (address)",
        "function getEntryPoint() view returns (address)"
      ],
      this.runner
    )
    const entryPoint = new ethers.Contract(
      await (async () => {
        try {
          return await account.entryPoint()
        } catch (e) {
          return await account.getEntryPoint()
        }
      })(),
      [
        "function getNonce(address sender, uint192 key) view returns (uint256 nonce)"
      ],
      this.runner
    )
    return entryPoint.getNonce(this.address, 0)
  }

  public async isDeployed(): Promise<boolean> {
    // TODO: Cache it
    const code = await this.runner.provider.getCode(await this.getAddress())
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
