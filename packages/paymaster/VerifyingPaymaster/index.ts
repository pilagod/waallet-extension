import * as ethers from "ethers"

import { UserOperation, UserOperationStruct } from "~packages/bundler"
import { connect, type ContractRunner } from "~packages/node"
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
    runner: ContractRunner,
    userOp: UserOperation,
    forGasEstimation = false
  ) {
    const validAfter = 0
    const validUntil =
      Math.floor(new Date().getTime() / 1000) + this.intervalSecs

    const signature = forGasEstimation
      ? "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
      : await this.getSignature(runner, userOp, validUntil, validAfter)

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
    runner: ContractRunner,
    userOp: UserOperation,
    validUntil: number,
    validAfter: number
  ) {
    const hash = await connect(this.paymaster, runner).getHash(
      userOp,
      validUntil,
      validAfter
    )
    return this.owner.signMessage(ethers.getBytes(hash))
  }
}
