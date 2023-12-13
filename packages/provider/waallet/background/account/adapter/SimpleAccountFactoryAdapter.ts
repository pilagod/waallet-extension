import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typings"

import { type EoaOwnedAccountFactoryAdapter } from "../eoa"

export class SimpleAccountFactoryAdapter
  implements EoaOwnedAccountFactoryAdapter
{
  private factory: ethers.Contract
  private nodeRpcProvider: ethers.JsonRpcProvider

  public constructor(factoryAddress: HexString, nodeRpcUrl: string) {
    this.factory = new ethers.Contract(factoryAddress, [
      "function getAddress(address owner, uint256 salt) view returns (address)",
      "function createAccount(address owner,uint256 salt)"
    ])
    this.nodeRpcProvider = new ethers.JsonRpcProvider(nodeRpcUrl)
  }

  public async getAddress(ownerAddress: HexString, salt: BigNumberish) {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        await this.nodeRpcProvider.call(
          await this.factory
            .getFunction("getAddress")
            .populateTransaction(ownerAddress, salt)
        )
      ),
      20
    )
  }

  public async getInitCode(ownerAddress: HexString, salt: BigNumberish) {
    const { data } = await this.factory
      .getFunction("createAccount")
      .populateTransaction(ownerAddress, salt)
    return ethers.concat([await this.factory.getAddress(), data])
  }
}
