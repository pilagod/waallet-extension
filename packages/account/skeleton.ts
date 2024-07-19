import * as ethers from "ethers"

import type { Account, Call } from "~packages/account"
import type { AccountFactory } from "~packages/account/factory"
import type { ContractRunner } from "~packages/node"
import { Address, type AddressLike } from "~packages/primitive"
import type { BytesLike, HexString } from "~typing"

import { Execution } from "./index"

export abstract class AccountSkeleton<T extends AccountFactory>
  implements Account
{
  protected address: Address
  protected factory?: T

  protected constructor(
    protected runner: ContractRunner,
    option: {
      address: AddressLike
      factory?: T
    }
  ) {
    this.address = Address.wrap(option.address)
    this.factory = option.factory
  }

  /* abstract */

  public abstract sign(message: BytesLike): Promise<HexString>
  protected abstract getCallData(call: Call): Promise<HexString>
  protected abstract getDummySignature(): Promise<HexString>

  /* public */

  public async buildExecution(call: Call) {
    const sender = this.getAddress()
    // Only nonce on chain can be used
    const nonce = await this.getNonce()
    // TODO: Split initCode in factory
    const initCode = await this.getInitCode()
    const callData = call ? await this.getCallData(call) : "0x"
    const dummySignature = await this.getDummySignature()

    return new Execution({
      sender,
      nonce,
      callData,
      signature: dummySignature,
      ...(ethers.dataLength(initCode) > 0 && {
        factory: ethers.dataSlice(initCode, 0, 20),
        factoryData: ethers.dataSlice(initCode, 20)
      })
    })
  }

  public getAddress() {
    return this.address
  }

  public getBalance() {
    return this.address.getBalance(this.runner.provider)
  }

  public async getEntryPoint() {
    if (!(await this.isDeployed())) {
      return this.mustGetFactory().getEntryPoint()
    }
    const account = new ethers.Contract(
      this.address,
      [
        "function entryPoint() view returns (address)",
        "function getEntryPoint() view returns (address)"
      ],
      this.runner
    )
    return Address.wrap(
      await (async () => {
        try {
          return await account.entryPoint()
        } catch (e) {
          return await account.getEntryPoint()
        }
      })()
    )
  }

  public async getNonce(): Promise<bigint> {
    if (!(await this.isDeployed())) {
      return 0n
    }
    const entryPoint = new ethers.Contract(
      await this.getEntryPoint(),
      [
        "function getNonce(address sender, uint192 key) view returns (uint256 nonce)"
      ],
      this.runner
    )
    return entryPoint.getNonce(this.address, 0)
  }

  public async isDeployed(): Promise<boolean> {
    return this.address.isContract(this.runner.provider)
  }

  /* protected */

  protected async getInitCode() {
    if (await this.isDeployed()) {
      return "0x"
    }
    return this.mustGetFactory().getInitCode()
  }

  protected mustGetFactory() {
    if (!this.factory) {
      throw new Error("No factory")
    }
    return this.factory
  }
}
