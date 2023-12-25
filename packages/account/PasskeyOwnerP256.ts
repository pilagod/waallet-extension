import { p256 } from "@noble/curves/p256"

import type { PasskeyOwner } from "./PasskeyOwner"

export class PasskeyOwnerP256 implements PasskeyOwner {
  private credentialId: string
  private privateKey: Uint8Array
  private publicKey: Uint8Array

  public set(credentialId: string) {
    if (this.credentialId === credentialId) {
      return
    }
    this.credentialId = credentialId
    this.privateKey = p256.utils.randomPrivateKey()
    this.publicKey = p256.getPublicKey(this.privateKey)
  }

  public async sign(challenge: string | Uint8Array) {
    if (!this.credentialId) {
      throw new Error("Credential id is not set")
    }
    // TODO:
    // (
    //     bytes memory authenticatorData,
    //     bool requireUserVerification,
    //     string memory clientDataJSON,
    //     uint256 challengeLocation,
    //     uint256 responseTypeLocation,
    //     uint256 r,
    //     uint256 s
    // ) = abi.decode(
    //     userOp.signature,
    //     (bytes, bool, string, uint256, uint256, uint256, uint256)
    // );
    const sig = p256.sign(this.normalize(challenge), this.privateKey)
    return sig.toCompactHex()
  }

  public async verify(challenge: string | Uint8Array, signature: string) {
    return p256.verify(signature, this.normalize(challenge), this.publicKey)
  }

  private normalize(challenge: string | Uint8Array) {
    if (challenge instanceof Uint8Array) {
      return challenge
    }
    const start = challenge.startsWith("0x") ? 2 : 0
    return Uint8Array.from(
      challenge
        .slice(start)
        .split("")
        .map((c) => c.charCodeAt(0))
    )
  }
}
