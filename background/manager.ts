import { AccountType } from "~packages/account"
import { imAccount } from "~packages/account/imAccount"
import { WebAuthnOwner } from "~packages/account/imAccount/validator/WebAuthnOwner"
import { WebAuthnValidator } from "~packages/account/imAccount/validator/webAuthnValidator"
import type { AccountManager } from "~packages/account/manager"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import type { NetworkManager } from "~packages/network/manager"
import { NodeProvider } from "~packages/node/provider"
import { ObservableStorage } from "~packages/storage/observable"

import type { State } from "./storage"

export class AccountStorageManager implements AccountManager {
  public constructor(private storage: ObservableStorage<State>) {}

  public async get(id: string) {
    const state = this.storage.get()
    const account = state.account[id]
    if (!account) {
      throw new Error(`Unknown account ${id}`)
    }
    switch (account.type) {
      case AccountType.SimpleAccount:
        return SimpleAccount.init({
          address: account.address,
          ownerPrivateKey: account.ownerPrivateKey
        })
      case AccountType.PasskeyAccount:
        return PasskeyAccount.init({
          address: account.address,
          owner: new PasskeyOwnerWebAuthn(account.credentialId)
        })
      case AccountType.imAccount:
        return await imAccount.init({
          address: account.address,
          validator: new WebAuthnValidator({
            address: account.webAuthnValidator,
            owner: new WebAuthnOwner(),
            x: BigInt(account.x),
            y: BigInt(account.y),
            authenticatorRpidHash: account.authenticatorRpidHash,
            credentialId: account.credentialId
          })
        })
      default:
        throw new Error(`Unknown account ${account}`)
    }
  }

  public async getActive() {
    const state = this.storage.get()
    const network = state.network[state.networkActive]
    return this.get(network.accountActive)
  }
}

export class NetworkStorageManager implements NetworkManager {
  public constructor(private storage: ObservableStorage<State>) {}

  public get(id: string) {
    const state = this.storage.get()
    const network = state.network[id]
    if (!network) {
      throw new Error(`Unknown network ${id}`)
    }
    return {
      id,
      chainId: network.chainId,
      node: new NodeProvider(network.nodeRpcUrl),
      bundler: new BundlerProvider(
        network.bundlerRpcUrl,
        this.isLocalTestnet(network.chainId)
          ? BundlerMode.Manual
          : BundlerMode.Auto
      )
    }
  }

  public getActive() {
    const { networkActive } = this.storage.get()
    return this.get(networkActive)
  }

  private isLocalTestnet(chainId: number) {
    return chainId === 1337
  }
}
