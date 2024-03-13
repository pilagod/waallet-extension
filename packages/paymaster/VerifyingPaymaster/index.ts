import * as ethers from "ethers"

import { UserOperation, UserOperationStruct } from "~packages/bundler"
import type { NetworkContext } from "~packages/context/network"
import type { Paymaster } from "~packages/paymaster"
import { ETH, Token } from "~packages/token"
import type { HexString } from "~typing"

export class VerifyingPaymaster implements Paymaster {
  private paymaster: ethers.Contract
  private owner: ethers.Wallet
  private intervalSecs: number

  public constructor(option: {
    address: HexString
    ownerPrivateKey: HexString
    expirationSecs: number
  }) {
    this.paymaster = new ethers.Contract(option.address, [
      `function getHash(${UserOperationStruct} userOp, uint48 validUntil, uint48 validAfter) public view returns (bytes32)`
    ])
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
    ctx: NetworkContext,
    userOp: UserOperation
  ) {
    const validAfter = 0
    const validUntil =
      Math.floor(new Date().getTime() / 1000) + this.intervalSecs
    const signature = await this.getSignature(
      ctx,
      userOp,
      validUntil,
      validAfter
    )
    return ethers.concat([
      await this.paymaster.getAddress(),
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint48", "uint48"],
        [validUntil, validAfter]
      ),
      signature
    ])
  }

  private async getSignature(
    ctx: NetworkContext,
    userOp: UserOperation,
    validUntil: number,
    validAfter: number
  ) {
    if (!userOp.isGasEstimated()) {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
    }
    const hash = await (
      this.paymaster.connect(ctx.node) as ethers.Contract
    ).getHash(userOp, validUntil, validAfter)
    return this.owner.signMessage(ethers.getBytes(hash))
  }
}
