export const config = {
  chainId: parseInt(process.env.PLASMO_PUBLIC_CHAIN_ID),
  nodeRpcUrl: process.env.PLASMO_PUBLIC_NODE_RPC_URL,
  bundlerRpcUrl: process.env.PLASMO_PUBLIC_BUNDLER_RPC_URL,

  simpleAccountAddress: process.env.PLASMO_PUBLIC_ACCOUNT,
  simpleAccountOwnerPrivateKey:
    process.env.PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY,

  passkeyAccountAddress: process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT,

  verifyingPaymasterAddress: process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER,
  verifyingPaymasterOwnerPrivateKey:
    process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER_OWNER_PRIVATE_KEY
}
