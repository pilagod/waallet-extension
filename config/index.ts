export const config = {
  chainId: parseInt(process.env.PLASMO_PUBLIC_CHAIN_ID),
  nodeRpcUrl: process.env.PLASMO_PUBLIC_NODE_RPC_URL,
  bundlerRpcUrl: process.env.PLASMO_PUBLIC_BUNDLER_RPC_URL,

  simpleAccountAddress: process.env.PLASMO_PUBLIC_ACCOUNT,
  simpleAccountOwnerPrivateKey:
    process.env.PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY,

  passkeyAccountAddress: process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT,
  passkeyAccountCredentialId:
    process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT_CREDENTIAL_ID,

  imAccountAddress: process.env.PLASMO_PUBLIC_IMACCOUNT,
  ecdsaValidaotorAddress: process.env.PLASMO_PUBLIC_ECDSA_VALIDATOR,
  imAccountOwnerPrivateKey: process.env.PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY,
  webAuthnValidaotorAddress: process.env.PLASMO_PUBLIC_WEBAUTHN_VALIDATOR,
  imAccountCredentialId: process.env.PLASMO_PUBLIC_IMACCOUNT_CREDENTIAL_ID,
  imAccountPasskeyX: process.env.PLASMO_PUBLIC_IMACCOUNT_PASSKEY_X,
  imAccountPasskeyY: process.env.PLASMO_PUBLIC_IMACCOUNT_PASSKEY_Y,
  authenticatorRpidHash:
    process.env.PLASMO_PUBLIC_IMACCOUNT_AUTHENTICATOR_RPID_HASH,

  verifyingPaymasterAddress: process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER,
  verifyingPaymasterOwnerPrivateKey:
    process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER_OWNER_PRIVATE_KEY
}
