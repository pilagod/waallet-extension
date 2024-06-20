import { p256 } from "@noble/curves/p256"
import { AbiCoder, getBytes, hashMessage, sha256 } from "ethers"

import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

describe("PasskeyOwnerP256", () => {
  const owner = new PasskeyOwnerP256()

  it("should verify signature", async () => {
    const challenge = "challenge"
    const signature = await owner.sign(challenge)
    const [, authenticatorData, , clientDataJson, , , r, s] =
      AbiCoder.defaultAbiCoder().decode(
        [
          "bool", // isSimulation
          "bytes", // authenticatorData
          "bool", // requireUserVerification
          "string", // clientDataJson
          "uint256", // challengeLocation
          "uint256", // responseTypeLocation
          "uint256", // r
          "uint256" // s
        ],
        signature
      )

    expect(
      Buffer.from(getBytes(hashMessage(challenge))).toString("base64url")
    ).toBe(JSON.parse(clientDataJson).challenge)

    const message = sha256(
      `${authenticatorData}${sha256(Buffer.from(clientDataJson)).slice(2)}`
    ).slice(2)

    expect(p256.verify({ r, s }, message, owner.publicKey)).toBe(true)
  })
})
