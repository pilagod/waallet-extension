import * as ethers from "ethers"

import type {
  Paymaster,
  PaymasterRequestOption,
  PaymasterUserOperation
} from "~packages/paymaster"
import { UserOperationStruct } from "~packages/provider/bundler"
import type { HexString } from "~typing"

export class VerifyingPaymaster implements Paymaster {
  private paymaster: ethers.Contract
  private owner: ethers.Wallet
  private intervalSecs: number

  public constructor(option: {
    address: HexString
    ownerPrivateKey: HexString
    intervalSecs: number
    nodeRpcUrl: string
  }) {
    this.paymaster = new ethers.Contract(
      option.address,
      [
        `function getHash(${UserOperationStruct} userOp, uint48 validUntil, uint48 validAfter) public view returns (bytes32)`
      ],
      new ethers.JsonRpcProvider(option.nodeRpcUrl)
    )
    this.owner = new ethers.Wallet(option.ownerPrivateKey)
    this.intervalSecs = option.intervalSecs
  }

  public async requestPaymasterAndData(
    userOp: PaymasterUserOperation,
    option?: PaymasterRequestOption
  ) {
    const validAfter = 0
    const validUntil =
      Math.floor(new Date().getTime() / 1000) + this.intervalSecs
    const signature = await this.getSignature({
      userOp,
      validUntil,
      validAfter,
      isGasEstimation: !!option?.isGasEstimation
    })
    return ethers.concat([
      await this.paymaster.getAddress(),
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint48", "uint48"],
        [validUntil, validAfter]
      ),
      signature
    ])
  }

  private async getSignature(option: {
    userOp: PaymasterUserOperation
    validUntil: number
    validAfter: number
    isGasEstimation: boolean
  }) {
    if (option.isGasEstimation) {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
    }
    const hash = await this.paymaster.getHash(
      option.userOp,
      option.validUntil,
      option.validAfter
    )
    return this.owner.signMessage(ethers.getBytes(hash))
  }
}
