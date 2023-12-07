import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typings"

import { type Account } from "./index"

export class EoaOwnedAccount implements Account {
  private owner: ethers.Wallet

  private accountAddress?: HexString

  private factory: ethers.Contract
  private salt: BigNumberish
  private nodeRpcProvider: ethers.JsonRpcProvider

  public constructor(opts: {
    ownerPrivateKey: HexString
    accountAddress: HexString
  })
  public constructor(opts: {
    ownerPrivateKey: HexString
    // TODO: Extract factory strategy
    factoryAddress: HexString
    salt: BigNumberish
    nodeRpcUrl: string
  })
  public constructor(
    opts:
      | {
          ownerPrivateKey: HexString
          accountAddress: HexString
        }
      | {
          ownerPrivateKey: HexString
          factoryAddress: HexString
          salt: BigNumberish
          nodeRpcUrl: string
        }
  ) {
    if ("accountAddress" in opts) {
      this.accountAddress = opts.accountAddress
    }
    if ("factoryAddress" in opts) {
      this.factory = new ethers.Contract(opts.factoryAddress, [
        "function getAddress(address owner, uint256 salt) view returns (address)"
      ])
      this.salt = opts.salt
      this.nodeRpcProvider = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    }
    this.owner = new ethers.Wallet(opts.ownerPrivateKey)
  }

  public async getAddress() {
    if (!this.accountAddress) {
      this.accountAddress = ethers.zeroPadValue(
        ethers.stripZerosLeft(
          await this.nodeRpcProvider.call(
            await this.factory
              .getFunction("getAddress")
              .populateTransaction(this.owner.address, this.salt)
          )
        ),
        20
      )
    }
    return this.accountAddress
  }

  public signMessage(message: string | Uint8Array) {
    return this.owner.signMessage(ethers.getBytes(message))
  }
}
