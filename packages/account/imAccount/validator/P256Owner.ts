import { p256 } from "@noble/curves/p256"
import * as ethers from "ethers"

import type { BytesLike, HexString } from "~typing"

import type { PasskeyOwner } from "../../PasskeyAccount/passkeyOwner"

export class P256Owner implements PasskeyOwner {
  public credentialId: string
  public privateKey: Uint8Array
  public publicKey: Uint8Array
  public x: bigint
  public y: bigint

  public constructor() {
    this.privateKey = p256.utils.randomPrivateKey()
    this.publicKey = p256.getPublicKey(this.privateKey)

    const point = p256.ProjectivePoint.fromPrivateKey(this.privateKey)
    this.x = point.x
    this.y = point.y
  }

  public use(credentialId: string) {
    this.credentialId = credentialId
  }

  public async sign(challenge: BytesLike): Promise<HexString> {
    if (!this.credentialId) {
      throw new Error("Credential id is not set")
    }

    let { r, s } = p256.sign(challenge, this.privateKey)
    if (s > p256.CURVE.n / 2n) {
      s = p256.CURVE.n - s
    }
    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [r, s]
    )
    return signature
  }
}
