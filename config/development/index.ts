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
      chainId: 137,
      name: "Polygon",
      active: accountChainId === 137,
      nodeRpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY}`,
      bundlerRpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY}`,
      entryPoint: {
        [EntryPointVersion.V0_6]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        [EntryPointVersion.V0_7]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
      },
      accountFactory: {
        [AccountType.SimpleAccount]:
          "0x94b797AC2a89400A30ec1DC583a45b45BcF707c7",
        [AccountType.PasskeyAccount]:
          "0x4B13F6BcC9B8EB780C6a1A82F5796135C238767D" // v0.7
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
          "0x261D8c5e9742e6f7f1076Fa1F560894524e19cad", // v0.7
        [AccountType.PasskeyAccount]:
          "0xCba6b9A951749B8735C603e7fFC5151849248772" // v0.7
      }
    },

    {
      chainId: 80002,
      name: "Polygon Amoy",
      active: accountChainId === 80002,
      nodeRpcUrl: `https://polygon-amoy.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY}`,
      bundlerRpcUrl: `https://polygon-amoy.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY}`,
      entryPoint: {
        [EntryPointVersion.V0_6]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        [EntryPointVersion.V0_7]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
      },
      accountFactory: {
        [AccountType.SimpleAccount]:
          "0x5e85DD2Eb66CD7C92Ed469336Dc58d8F7efa62Cc", // v0.7
        [AccountType.PasskeyAccount]:
          "0xccd0AE1467e4A70528f2c2A9E63800Acfec506dE" // v0.7
      }
    },

    {
      chainId: 11155111,
      name: "Sepolia",
      active: accountChainId === 11155111,
      nodeRpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY}`,
      bundlerRpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_ALCHEMY_API_KEY}`,
      entryPoint: {
        [EntryPointVersion.V0_6]: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        [EntryPointVersion.V0_7]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
      },
      accountFactory: {
        [AccountType.SimpleAccount]:
          "0x983D1f4ddA8f48d38155DFf89c632AF5CD384d32", // v0.6
        [AccountType.PasskeyAccount]:
          "0x0a1De47125A52123a8e4a296fCeC478440e42cd8" // v0.6
      }
    }
  ]
}
