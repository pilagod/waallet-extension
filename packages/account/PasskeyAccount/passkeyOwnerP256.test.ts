import { p256 } from "@noble/curves/p256"

import { Bytes } from "~packages/primitive"

import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

describe("PasskeyOwnerP256", () => {
  const owner = new PasskeyOwnerP256()

  it("should verify signature", async () => {
    const challenge = "challenge"

    const {
      authenticatorData,
      clientDataJson,
      signature: { r, s }
    } = await owner.sign(challenge)

    expect(Bytes.wrap(challenge).unwrap("base64url")).toBe(
      JSON.parse(clientDataJson).challenge
    )

    const message = Bytes.wrap(authenticatorData)
      .concat(Bytes.wrap(clientDataJson).sha256())
      .sha256()
      .unwrap("hex")

    expect(p256.verify({ r, s }, message.slice(2), owner.publicKey)).toBe(true)
  })
})
