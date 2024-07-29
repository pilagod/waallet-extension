import Ethereum from "data-base64:~assets/ethereumLight.svg"
import Polygon from "data-base64:~assets/polygon.svg"

export type NetworkMetadata = {
  chainId: number
  name: string
  icon: string
  tokenSymbol: string
}

export const NetworkConfig: Record<number, NetworkMetadata> = {
  [137]: {
    chainId: 137,
    name: "Polygon",
    icon: Polygon,
    tokenSymbol: "MATIC"
  },
  [1337]: {
    chainId: 1337,
    name: "Geth Testnet",
    icon: Ethereum,
    tokenSymbol: "ETH"
  },
  [80002]: {
    chainId: 80002,
    name: "Polygon Amoy",
    icon: Polygon,
    tokenSymbol: "MATIC"
  },
  [11155111]: {
    chainId: 11155111,
    name: "Sepolia",
    icon: Ethereum,
    tokenSymbol: "ETH"
  }
}
