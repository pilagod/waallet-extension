declare namespace NodeJS {
  interface ProcessEnv {
    /* Extension */

    PLASMO_PUBLIC_ENV?: string

    /* Network */

    PLASMO_PUBLIC_ALCHEMY_API_KEY?: string

    /* Development Only */

    PLASMO_PUBLIC_ACCOUNT_CHAIN_ID?: string

    PLASMO_PUBLIC_ACCOUNT?: string
    PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY?: string

    PLASMO_PUBLIC_PASSKEY_ACCOUNT?: string
    PLASMO_PUBLIC_PASSKEY_ACCOUNT_CREDENTIAL_ID?: string

    PLASMO_PUBLIC_VERIFYING_PAYMASTER?: string
    PLASMO_PUBLIC_VERIFYING_PAYMASTER_VERIFYING_SIGNER_PRIVATE_KEY?: string
  }
}
