import { AccountType } from "~packages/account"

const accountChainId = parseInt(process.env.PLASMO_PUBLIC_ACCOUNT_CHAIN_ID)

export const config = {
  accounts: [
    {
      type: AccountType.SimpleAccount as AccountType.SimpleAccount,
      chainId: accountChainId,
      address: process.env.PLASMO_PUBLIC_ACCOUNT,
      ownerPrivateKey: process.env.PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY,
      tokens: []
    },
    {
      type: AccountType.PasskeyAccount as AccountType.PasskeyAccount,
      chainId: accountChainId,
      address: process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT,
      credentialId: process.env.PLASMO_PUBLIC_PASSKEY_ACCOUNT_CREDENTIAL_ID,
      tokens: []
    }
  ].filter((a) => a.address),

  networks: [
    {
      chainId: 11155111,
      name: "Sepolia",
      active: accountChainId === 11155111,
      nodeRpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_SEPOLIA_ALCHEMY_API_KEY}`,
      bundlerRpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.PLASMO_PUBLIC_SEPOLIA_ALCHEMY_API_KEY}`,
      accountFactory: {
        [AccountType.SimpleAccount]: {
          address: "0x983D1f4ddA8f48d38155DFf89c632AF5CD384d32"
        },
        [AccountType.PasskeyAccount]: {
          address: "0x5A0b3668719722c16fE44f5A2C28c85B4Bbed606"
        }
      }
    },
    {
      chainId: 1337,
      name: "Local",
      active: accountChainId === 1337,
      nodeRpcUrl: "http://localhost:8545",
      bundlerRpcUrl: "http://localhost:3000",
      accountFactory: {
        [AccountType.SimpleAccount]: {
          address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
        },
        [AccountType.PasskeyAccount]: {
          address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
        }
      }
    }
  ]
}
