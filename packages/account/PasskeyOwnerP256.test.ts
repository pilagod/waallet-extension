import * as ethers from "ethers"

import { PasskeyOwnerP256 } from "./PasskeyOwnerP256"

describe("PasskeyOwnerP256", () => {
  const owner = new PasskeyOwnerP256()
  owner.set("credential-id")

  it("should sign challenge", async () => {
    const challenge = ethers.keccak256(
      Uint8Array.from(
        Buffer.from("challenge")
          .toString("base64")
          .split("")
          .map((c) => c.charCodeAt(0))
      )
    )
    const signature = await owner.sign(challenge)
    expect(await owner.verify(challenge, signature)).toBe(true)
  })
})
