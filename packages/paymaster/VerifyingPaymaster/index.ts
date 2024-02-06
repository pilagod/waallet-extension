import * as ethers from "ethers"

import type {
  Paymaster,
  PaymasterRequestOption,
  PaymasterUserOperation
} from "~packages/paymaster"
import { UserOperationStruct } from "~packages/provider/bundler"
import type { HexString } from "~typing"

export class VerifyingPaymaster implements Paymaster {
  private node: ethers.JsonRpcProvider

  private paymaster: ethers.Contract
  private owner: ethers.Wallet
  private intervalSecs: number

  public constructor(option: {
    address: HexString
    ownerPrivateKey: HexString
    intervalSecs: number
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(option.nodeRpcUrl)
    this.paymaster = new ethers.Contract(
      option.address,
      [
        `function getHash(${UserOperationStruct} userOp, uint48 validUntil, uint48 validAfter) public view returns (bytes32)`
      ],
      this.node
    )
    this.owner = new ethers.Wallet(option.ownerPrivateKey)
    this.intervalSecs = option.intervalSecs
  }

  public async requestPaymasterAndData(
    userOp: PaymasterUserOperation,
    option?: PaymasterRequestOption
  ) {
    const { timestamp: validAfter } = await this.node.getBlock("latest")
    const validUntil = validAfter + this.intervalSecs
    // TODO: Refactor here
    if (option?.isGasEstimation) {
      return ethers.concat([
        await this.paymaster.getAddress(),
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["uint48", "uint48"],
          [validUntil, validAfter]
        ),
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
      ])
    }
    const hash = await this.paymaster.getHash(userOp, validUntil, validAfter)
    const signature = await this.owner.signMessage(ethers.getBytes(hash))
    return ethers.concat([
      await this.paymaster.getAddress(),
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint48", "uint48"],
        [validUntil, validAfter]
      ),
      signature
    ])
  }
}
