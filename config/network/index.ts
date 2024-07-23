export default {
  [1337]: {
    chainId: 1337,
    name: "Geth Testnet",
    icon: "~assets/ethereum.svg"
  },
  [80002]: {
    chainId: 80002,
    name: "Polygon Amoy",
    icon: "~assets/polygon.svg"
  },
  [11155111]: {
    chainId: 11155111,
    name: "Sepolia",
    icon: "~assets/ethereum.svg"
  }
} as Record<
  number,
  {
    chainId: number
    name: string
    icon: string
  }
>
