declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_PUBLIC_CHAIN_ID?: string
    PLASMO_PUBLIC_NODE_RPC_URL?: string
    PLASMO_PUBLIC_BUNDLER_RPC_URL?: string

    PLASMO_PUBLIC_ACCOUNT?: string
    PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY?: string

    PLASMO_PUBLIC_PASSKEY_ACCOUNT?: string
    PLASMO_PUBLIC_PASSKEY_ACCOUNT_CREDENTIAL_ID?: string
    PLASMO_PUBLIC_PASSKEY_ACCOUNT_FACTORY?: string

    PLASMO_PUBLIC_VERIFYING_PAYMASTER?: string
    PLASMO_PUBLIC_VERIFYING_PAYMASTER_OWNER_PRIVATE_KEY?: string
  }
}
