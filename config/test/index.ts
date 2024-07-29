import * as ethers from "ethers"

import { EntryPointVersion } from "~packages/bundler"
import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import { NodeProvider } from "~packages/node/provider"

const address = {
  Counter: "0x8464135c8F25Da09e49BC8782676a84730C318bC",
  TestToken: "0x71C95911E9a5D330f4D621842EC243EE1343292e",

  /* v0.6 */

  EntryPointV0_6: "0x663F3ad617193148711d28f5334eE4Ed07016602",
  SimpleAccountFactoryV0_6: "0x2E983A1Ba5e8b38AAAeC4B440B9dDcFBf72E15d1",
  SimpleAccountV0_6: "0x7Fa35750bF7e98891019460b0B3194bE27E86859",
  PasskeyAccountFactoryV0_6: "0xBC9129Dc0487fc2E169941C75aABC539f208fb01",
  PasskeyAccountV0_6: "0x62c45C04e3Be191E88836852dAFF7B6CE8e6aCF9",
  VerifyingPaymasterV0_6: "0xF6168876932289D073567f347121A267095f3DD6",

  /* v0.7 */

  EntryPointV0_7: "0x057ef64E23666F000b34aE31332854aCBd1c8544",
  SimpleAccountFactoryV0_7: "0x261D8c5e9742e6f7f1076Fa1F560894524e19cad",
  SimpleAccountV0_7: "0xD0dA07666BA2139aa6fF7A450A8596291a6cE471",
  PasskeyAccountFactoryV0_7: "0xCba6b9A951749B8735C603e7fFC5151849248772",
  PasskeyAccountV0_7: "0xa83e7ae8d81F8F5EBa94dfB45b836bdb4785bfC2",
  VerifyingPaymasterV0_7: "0xcf27F781841484d5CF7e155b44954D7224caF1dD"
}

const provider = {
  node: new NodeProvider("http://localhost:8545"),
  bundler: new BundlerProvider({
    url: "http://localhost:3000",
    entryPoint: {
      [EntryPointVersion.V0_6]: address.EntryPointV0_6,
      [EntryPointVersion.V0_7]: address.EntryPointV0_7
    },
    mode: BundlerMode.Manual
  })
}
const { node } = provider

class WalletNonceManager extends ethers.NonceManager {
  public constructor(private wallet: ethers.Wallet) {
    super(wallet)
  }

  public get privateKey() {
    return this.wallet.privateKey
  }
}

const wallet = {
  operator: new WalletNonceManager(
    new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      node
    )
  )
}

const contract = {
  counter: new ethers.Contract(
    address.Counter,
    [
      "function number() view returns (uint256)",
      "function increment() payable"
    ],
    node
  ),

  /* v0.6 */

  entryPointV0_6: new ethers.Contract(
    address.EntryPointV0_6,
    ["function balanceOf(address account) public view returns (uint256)"],
    node
  ),
  simpleAccountFactoryV0_6: new ethers.Contract(
    address.SimpleAccountFactoryV0_6,
    ["function getAddress(address owner, uint256 salt) view returns (address)"],
    node
  ),
  simpleAccountV0_6: new ethers.Contract(address.SimpleAccountV0_6, [], node),
  passkeyAccountFactoryV0_6: new ethers.Contract(
    address.PasskeyAccountFactoryV0_6,
    [],
    node
  ),

  /* v0.7 */

  entryPointV0_7: new ethers.Contract(
    address.EntryPointV0_7,
    ["function balanceOf(address account) public view returns (uint256)"],
    node
  )
}

export default {
  address,
  contract,
  provider,
  wallet
}
