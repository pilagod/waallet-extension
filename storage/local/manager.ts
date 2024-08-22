import { AccountType } from "~packages/account"
import type { AccountManager } from "~packages/account/manager"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import {
  BundlerMode,
  BundlerProvider
} from "~packages/eip/4337/bundler/provider"
import type { NetworkManager } from "~packages/network/manager"
import type { ContractRunner } from "~packages/node"
import { NodeProvider } from "~packages/node/provider"
import { ObservableStorage } from "~packages/storage/observable"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { HexString } from "~typing"

import type { Account, State } from "./state"

export class AccountStorageManager implements AccountManager {
  public static async wrap(runner: ContractRunner, account: Account) {
    switch (account.type) {
      case AccountType.SimpleAccount:
        if (!account.factoryAddress) {
          return SimpleAccount.init(runner, {
            address: account.address,
            ownerPrivateKey: account.ownerPrivateKey
          })
        }
        return SimpleAccount.initWithFactory(runner, {
          ownerPrivateKey: account.ownerPrivateKey,
          factoryAddress: account.factoryAddress,
          salt: number.toBigInt(account.salt)
        })
      case AccountType.PasskeyAccount:
        if (!account.factoryAddress) {
          return PasskeyAccount.init(runner, {
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

  public async getByAddress(accountAddress: HexString, chainId: number) {
    const { account } = this.storage.get()
    const [accountId] = Object.entries(account)
      .filter(([, a]) => {
        return (
          address.isEqual(a.address, accountAddress) && a.chainId === chainId
        )
      })
      .map(([id]) => id)
    return this.get(accountId)
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
      bundler: new BundlerProvider({
        url: network.bundlerRpcUrl,
        entryPoint: network.entryPoint,
        mode: this.isLocalTestnet(network.chainId)
          ? BundlerMode.Manual
          : BundlerMode.Auto
      })
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
