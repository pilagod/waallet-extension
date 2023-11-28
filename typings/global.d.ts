declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_PUBLIC_ACCOUNT?: string
    PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY?: string
    PLASMO_PUBLIC_NODE_RPC_URL?: string
    PLASMO_PUBLIC_BUNDLER_RPC_URL?: string
  }
}
