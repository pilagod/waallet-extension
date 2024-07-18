import { useAccount, useTokens } from "~app/hook/storage"
import { getChainName } from "~packages/network/util"

export const getUserTokens = () => {
  const account = useAccount()
  const nativeToken = {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    symbol: `${getChainName(account.chainId)}ETH`,
    decimals: 18,
    balance: account.balance
  }
  return [nativeToken, ...useTokens()]
}
