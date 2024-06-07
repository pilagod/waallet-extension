import * as ethers from "ethers"

import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import { NodeProvider } from "~packages/node/provider"

const provider = {
  node: new NodeProvider("http://localhost:8545"),
  bundler: new BundlerProvider("http://localhost:3000", BundlerMode.Manual)
}
const { node } = provider

const wallet = {
  operator: new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    node
  )
}

const address = {
  Counter: "0x8464135c8F25Da09e49BC8782676a84730C318bC",
  EntryPoint: "0x663F3ad617193148711d28f5334eE4Ed07016602",
  SimpleAccountFactory: "0x2E983A1Ba5e8b38AAAeC4B440B9dDcFBf72E15d1",
  SimpleAccount: "0x1E684E8937774B00Ee2Ea562256f27a5c9D20d7c",
  PasskeyAccountFactory: "0xBC9129Dc0487fc2E169941C75aABC539f208fb01",
  PasskeyAccount: "0xF4bb6e38fC8A5ec977D4Fdc74B4E0fa84c8dc704",
  VerifyingPaymaster: "0xF6168876932289D073567f347121A267095f3DD6"
}

const contract = {
  entryPoint: new ethers.Contract(
    address.EntryPoint,
    ["function balanceOf(address account) public view returns (uint256)"],
    node
  ),
  simpleAccountFactory: new ethers.Contract(
    address.SimpleAccountFactory,
    ["function getAddress(address owner, uint256 salt) view returns (address)"],
    node
  ),
  simpleAccount: new ethers.Contract(address.SimpleAccount, [], node),
  counter: new ethers.Contract(
    address.Counter,
    [
      "function number() view returns (uint256)",
      "function increment() payable"
    ],
    node
  ),
  passkeyAccountFactory: new ethers.Contract(
    address.PasskeyAccountFactory,
    [],
    node
  )
}

export default {
  address,
  contract,
  provider,
  wallet
}
