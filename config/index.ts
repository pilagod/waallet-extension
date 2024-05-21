import { AccountType, type Token } from "~packages/account"
import type { HexString } from "~typing"

import { config as developmentConfig } from "./development"

export type Config = {
  accounts: (
    | {
        type: AccountType.SimpleAccount
        chainId: number
        address: HexString
        ownerPrivateKey: HexString
      }
    | {
        type: AccountType.PasskeyAccount
        chainId: number
        address: HexString
        credentialId: string
      }
  )[]

  networks: {
    chainId: number
    name: string
    active: boolean
    nodeRpcUrl: string
    bundlerRpcUrl: string
    accountFactory: {
      [type in AccountType]: {
        address: string
      }
    }
  }[]
}

export function getConfig(): Config {
  const env = process.env.PLASMO_PUBLIC_ENV
  if (env === "development") {
    return developmentConfig
  }
  throw new Error(`Unsupported env ${env}`)
}
