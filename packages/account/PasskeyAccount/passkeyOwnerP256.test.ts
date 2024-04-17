import { PasskeyOwnerP256 } from "./passkeyOwnerP256"

describe("PasskeyOwnerP256", () => {
  const owner = new PasskeyOwnerP256()

  it("should sign challenge", async () => {
    const challenge = "challenge"
    const signature = await owner.sign(challenge)
    console.log(signature)
  })
})
