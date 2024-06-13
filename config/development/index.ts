import { AccountType } from "~packages/account"
import { EntryPointVersion } from "~packages/bundler"

const accountChainId = parseInt(process.env.PLASMO_PUBLIC_ACCOUNT_CHAIN_ID)

export const config = {
  accounts: [
    {
      type: AccountType.SimpleAccount as AccountType.SimpleAccount,
      chainId: accountChainId,
      address: process.env.PLASMO_PUBLIC_ACCOUNT,
      ownerPrivateKey: process.env.PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY
    },
    {
      type: AccountType.PasskeyAccount as AccountType.PasskeyAccount,
      chainId: accountChainId,
      address: process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT,
      credentialId: process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT_CREDENTIAL_ID
    }
  ].filter((a) => a.address),

  networks: [
    {
      chainId: 11155111,
      name: "Sepolia",
      active: accountChainId === 11155111,
      nodeRpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_SEPOLIA_ALCHEMY_API_KEY}`,
      bundlerRpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_SEPOLIA_ALCHEMY_API_KEY}`,
      entryPoint: {
        [EntryPointVersion.V0_6]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        [EntryPointVersion.V0_7]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
      },
      accountFactory: {
        [AccountType.SimpleAccount]:
          "0x983D1f4ddA8f48d38155DFf89c632AF5CD384d32",
        [AccountType.PasskeyAccount]:
          "0x5A0b3668719722c16fE44f5A2C28c85B4Bbed606"
      }
    },
    {
      chainId: 1337,
      name: "Local",
      active: accountChainId === 1337,
      nodeRpcUrl: "http://localhost:8545",
      bundlerRpcUrl: "http://localhost:3000",
      entryPoint: {
        [EntryPointVersion.V0_6]: "0x663F3ad617193148711d28f5334eE4Ed07016602",
        [EntryPointVersion.V0_7]: "0x057ef64E23666F000b34aE31332854aCBd1c8544"
      },
      accountFactory: {
        [AccountType.SimpleAccount]:
          "0x2E983A1Ba5e8b38AAAeC4B440B9dDcFBf72E15d1",
        [AccountType.PasskeyAccount]:
          "0xBC9129Dc0487fc2E169941C75aABC539f208fb01"
      }
    }
  ]
}
