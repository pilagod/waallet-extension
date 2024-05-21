import { AccountType } from "~packages/account"
import type { AccountManager } from "~packages/account/manager"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import type { NetworkManager } from "~packages/network/manager"
import type { ContractRunner } from "~packages/node"
import { NodeProvider } from "~packages/node/provider"
import { ObservableStorage } from "~packages/storage/observable"
import number from "~packages/util/number"

import type { Account, State } from "./index"

export class AccountStorageManager implements AccountManager {
  public static async wrap(runner: ContractRunner, account: Account) {
    switch (account.type) {
      case AccountType.SimpleAccount:
        return SimpleAccount.init({
          address: account.address,
          ownerPrivateKey: account.ownerPrivateKey
        })
      case AccountType.PasskeyAccount:
        if (!account.factoryAddress) {
          return PasskeyAccount.init({
            address: account.address,
            owner: new PasskeyOwnerWebAuthn(account.credentialId)
          })
        }
        return PasskeyAccount.initWithFactory(runner, {
          owner: new PasskeyOwnerWebAuthn(
            account.credentialId,
            account.publicKey && {
              x: number.toBigInt(account.publicKey.x),
              y: number.toBigInt(account.publicKey.y)
            }
          ),
          salt: number.toBigInt(account.salt),
          factoryAddress: account.factoryAddress
        })
      default:
        throw new Error(`Unknown account ${account}`)
    }
  }
  public constructor(
    private storage: ObservableStorage<State>,
    private networkManager: NetworkManager
  ) {}

  public async get(id: string) {
    const state = this.storage.get()
    const account = state.account[id]
    if (!account) {
      throw new Error(`Unknown account ${id}`)
    }
    const { node } = this.networkManager.getActive()
    return {
      id,
      account: await AccountStorageManager.wrap(node, account)
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