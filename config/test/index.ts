import * as ethers from "ethers"

import type { UserOperation } from "~packages/provider/bundler"
import {
  BundlerMode,
  BundlerProvider
} from "~packages/provider/bundler/provider"
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
  SimpleAccount: "0x9d2bcde83261a7fa850b6b24fd6a9a81e9599d25", // Affected by adding imAccount submodule
  Counter: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  PasskeyAccountFactory: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  PasskeyAccount: "0x0117c0f95ab2d5473f7bbf51cce922353d822905", // Affected by adding imAccount submodule
  VerifyingPaymaster: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  imAccountImplementation: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
  ECDSAValidator: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
  FallbackHandler: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
  imAccountFactory: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
  imAccountProxy: "0xedf78a47be65e9206064e3f99902a969ff58ee93"
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
