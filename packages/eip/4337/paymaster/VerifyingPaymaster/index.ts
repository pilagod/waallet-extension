import * as ethers from "ethers"

import type { Paymaster } from "~packages/eip/4337/paymaster"
import {
  UserOperationV0_6,
  UserOperationV0_7,
  type UserOperation
} from "~packages/eip/4337/userOperation"
import { type ContractRunner } from "~packages/node"
import { ETH, type Token } from "~packages/token"
import type { HexString } from "~typing"

export class VerifyingPaymaster implements Paymaster {
  private address: HexString
  private owner: ethers.Wallet
  private intervalSecs: number

  public constructor(
    private runner: ContractRunner,
    option: {
      address: HexString
      ownerPrivateKey: HexString
      expirationSecs: number
    }
  ) {
    this.address = option.address
    this.owner = new ethers.Wallet(option.ownerPrivateKey)
    this.intervalSecs = option.expirationSecs
  }

  public async quoteFee(_: bigint, quote: Token) {
    if (quote !== ETH) {
      throw new Error(`Unsupported token: ${quote.symbol}`)
    }
    return 0n
  }

  public async requestPaymasterAndData(
    userOp: UserOperation,
    forGasEstimation = false
  ) {
    const validAfter = 0
    const validUntil =
      Math.floor(new Date().getTime() / 1000) + this.intervalSecs

    const signature = forGasEstimation
      ? "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
      : await this.getSignature(userOp, validUntil, validAfter)

    return ethers.concat([
      this.address,
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint48", "uint48"],
        [validUntil, validAfter]
      ),
      signature
    ])
  }

  private async getSignature(
    userOp: UserOperation,
    validUntil: number,
    validAfter: number
  ) {
    const hash = await this.getHash(userOp, validUntil, validAfter)
    return this.owner.signMessage(ethers.getBytes(hash))
  }

  private getHash(
    userOp: UserOperation,
    validUntil: number,
    validAfter: number
  ) {
    if (userOp instanceof UserOperationV0_6) {
      const paymaster = new ethers.Contract(
        this.address,
        [
          `function getHash(${UserOperationV0_6.getSolidityStructType()} userOp, uint48 validUntil, uint48 validAfter) public view returns (bytes32)`
        ],
        this.runner
      )
      return paymaster.getHash(userOp.unwrap(), validUntil, validAfter)
    }
    const paymaster = new ethers.Contract(
      this.address,
      [
        `function getHash(${UserOperationV0_7.getSolidityStructType()} userOp, uint48 validUntil, uint48 validAfter) public view returns (bytes32)`
      ],
      this.runner
    )
    return paymaster.getHash(userOp.unwrapPacked(), validUntil, validAfter)
  }
}
