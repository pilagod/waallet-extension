import Ethereum from "data-base64:~assets/ethereumLight.svg"
import Polygon from "data-base64:~assets/polygon.svg"

export default {
  [1337]: {
    chainId: 1337,
    name: "Geth Testnet",
    icon: Ethereum
  },
  [80002]: {
    chainId: 80002,
    name: "Polygon Amoy",
    icon: Polygon
  },
  [11155111]: {
    chainId: 11155111,
    name: "Sepolia",
    icon: Ethereum
  }
} as Record<
  number,
  {
    chainId: number
    name: string
    icon: string
  }
>
