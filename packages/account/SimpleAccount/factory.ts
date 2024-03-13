import * as ethers from "ethers"

import type { AccountFactory } from "~packages/account/factory"
import type { NetworkContext } from "~packages/context/network"
import type { BigNumberish, HexString } from "~typing"

export class SimpleAccountFactory implements AccountFactory {
  private factory: ethers.Contract
  private owner: HexString
  private salt: BigNumberish

  public constructor(opts: {
    address: string
    owner: HexString
    salt: BigNumberish
  }) {
    this.factory = new ethers.Contract(opts.address, [
      "function getAddress(address owner, uint256 salt) view returns (address)",
      "function createAccount(address owner,uint256 salt)"
    ])
    this.owner = opts.owner
    this.salt = opts.salt
  }

  public async getAddress(ctx: NetworkContext) {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        // The name of `getAddress` conflicts with the function on ethers.Contract.
        // So we build call data from interface and directly send through node rpc provider.
        await ctx.node.call(
          await this.factory
            .getFunction("getAddress")
            .populateTransaction(this.owner, this.salt)
        )
      ),
      20
    )
  }

  public async getInitCode() {
    const { data } = await this.factory
      .getFunction("createAccount")
      .populateTransaction(this.owner, this.salt)
    return ethers.concat([await this.factory.getAddress(), data])
  }
}
