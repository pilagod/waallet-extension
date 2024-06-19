import { p256 } from "@noble/curves/p256"
import { isoBase64URL } from "@simplewebauthn/server/helpers"
import { AbiCoder, getBytes, hashMessage } from "ethers"

import byte from "~packages/util/byte"

import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

describe("PasskeyOwnerP256", () => {
  const owner = new PasskeyOwnerP256()

  it("should sign challenge", async () => {
    const challenge = "challenge"
    const signature = await owner.sign(challenge)
    console.log(signature)
  })

  it("should verify signature", async () => {
    const challenge = "challenge"
    const signature = await owner.sign(challenge)
    const [, authenticatorData, , clientDataJSON, , , r, s] =
      AbiCoder.defaultAbiCoder().decode(
        [
          "bool", // isSimulation
          "bytes", // authenticatorData
          "bool", // requireUserVerification
          "string", // clientDataJSON
          "uint256", // challengeLocation
          "uint256", // responseTypeLocation
          "uint256", // r
          "uint256" // s
        ],
        signature
      )

    expect(isoBase64URL.fromBuffer(getBytes(hashMessage(challenge)))).toBe(
      JSON.parse(clientDataJSON).challenge
    )

    const message = byte
      .sha256(
        `${authenticatorData}${byte.sha256(clientDataJSON).toString("hex")}`
      )
      .toString("hex")

    expect(p256.verify({ r, s }, message, owner.publicKey)).toBe(true)
  })
})
