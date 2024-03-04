import * as ethers from "ethers"

import { UserOperation } from "~packages/bundler"
import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import type { HexString, Nullable } from "~typing"

class BundlerProviderWithCache extends BundlerProvider {
  public lastSentUserOperation: Nullable<UserOperation> = null

  public async sendUserOperation(
    userOp: UserOperation,
    entryPointAddress: HexString
  ): Promise<HexString> {
    this.lastSentUserOperation = userOp
    return super.sendUserOperation(userOp, entryPointAddress)
  }
}

const rpc = {
  node: "http://localhost:8545",
  bundler: "http://localhost:3000"
}

const provider = {
  node: new ethers.JsonRpcProvider(rpc.node),
  bundler: new BundlerProviderWithCache(rpc.bundler, BundlerMode.Manual)
}

const account = {
  operator: new ethers.Wallet(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    provider.node
  )
}

const address = {
  EntryPoint: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  SimpleAccountFactory: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  SimpleAccount: "0x661b4a3909b486a3da520403ecc78f7a7b683c63",
  Counter: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  PasskeyAccountFactory: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  PasskeyAccount: "0xf30a89a6a3836e2b270650822e3f3cebff3b7497",
  VerifyingPaymaster: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
}

const contract = {
  entryPoint: new ethers.Contract(
    address.EntryPoint,
    ["function balanceOf(address account) public view returns (uint256)"],
    provider.node
  ),
  simpleAccountFactory: new ethers.Contract(
    address.SimpleAccountFactory,
    ["function getAddress(address owner, uint256 salt) view returns (address)"],
    provider.node
  ),
  simpleAccount: new ethers.Contract(address.SimpleAccount, [], provider.node),
  counter: new ethers.Contract(
    address.Counter,
    [
      "function number() view returns (uint256)",
      "function increment() payable"
    ],
    provider.node
  ),
  passkeyAccountFactory: new ethers.Contract(
    address.PasskeyAccountFactory,
    [],
    provider.node
  )
}

export default {
  account,
  address,
  contract,
  provider,
  rpc
}
