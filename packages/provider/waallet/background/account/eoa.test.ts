import * as ethers from "ethers"

import { EoaOwnedAccount } from "./eoa"

describe("EoaOwnedAccount", () => {
  const nodeRpcUrl = "http://localhost:8545"
  const nodeProvider = new ethers.JsonRpcProvider(nodeRpcUrl)

  const ownerPrivateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  const owner = new ethers.Wallet(ownerPrivateKey, nodeProvider)

  const factory = new ethers.Contract(
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    ["function getAddress(address owner, uint256 salt) view returns (address)"],
    nodeProvider
  )

  it("should compute address from factory", async () => {
    const account = new EoaOwnedAccount({
      ownerPrivateKey,
      factoryAddress: await factory.getAddress(),
      salt: 123,
      nodeRpcUrl
    })

    const got = await account.getAddress()
    const expected = ethers.zeroPadValue(
      ethers.stripZerosLeft(
        await nodeProvider.call(
          await factory
            .getFunction("getAddress")
            .populateTransaction(owner.address, 123)
        )
      ),
      20
    )
    expect(got).toBe(expected)
  })
})
