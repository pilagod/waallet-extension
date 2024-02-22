import * as ethers from "ethers"

import type { Paymaster, PaymasterUserOperation } from "~packages/paymaster"
import { UserOperationStruct } from "~packages/provider/bundler"
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
    provider: ethers.ContractRunner
  }) {
    this.paymaster = new ethers.Contract(
      option.address,
      [
        `function getHash(${UserOperationStruct} userOp, uint48 validUntil, uint48 validAfter) public view returns (bytes32)`
      ],
      option.provider
    )
    this.owner = new ethers.Wallet(option.ownerPrivateKey)
    this.intervalSecs = option.expirationSecs
  }

  public async getExchangeRate(quote: Token) {
    if (quote !== ETH) {
      throw new Error(`Unsupported token: ${quote.symbol}`)
    }
    return {
      rate: 0n,
      decimals: 0
    }
  }

  public async quoteFee(fee: bigint, quote: Token) {
    if (quote !== ETH) {
      throw new Error(`Unsupported token: ${quote.symbol}`)
    }
    return 0n
  }

  public async requestPaymasterAndData(userOp: PaymasterUserOperation) {
    const validAfter = 0
    const validUntil =
      Math.floor(new Date().getTime() / 1000) + this.intervalSecs
    const signature = await this.getSignature(userOp, validUntil, validAfter)

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
    userOp: PaymasterUserOperation,
    validUntil: number,
    validAfter: number
  ) {
    const isGasEstimation = !(
      userOp.callGasLimit &&
      userOp.verificationGasLimit &&
      userOp.preVerificationGas
    )
    if (isGasEstimation) {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
    }
    const hash = await this.paymaster.getHash(userOp, validUntil, validAfter)
    return this.owner.signMessage(ethers.getBytes(hash))
  }
}
