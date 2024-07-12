import * as ethers from "ethers"
import { useCallback, useState, type ChangeEvent } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import { useAccount, useTokens } from "~app/storage"
import { getChainName } from "~packages/network/util"
import { Token as TokenClass } from "~packages/token"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { type Token } from "~storage/local/state"
import type { BigNumberish, HexString } from "~typing"

export function Send() {
  const { provider } = useProviderContext()
  const account = useAccount()

  const nativeToken: Token = {
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    symbol: `${getChainName(account.chainId)}ETH`,
    decimals: 18,
    balance: account.balance
  }
  const tokens = [nativeToken, ...useTokens()]

  const [token, setToken] = useState<Token>(nativeToken)
  const [txTo, setTxTo] = useState<HexString>("")
  const [txValue, setTxValue] = useState<BigNumberish>("0")
  const [invalidTo, setInvalidTo] = useState<boolean>(false)
  const [invalidValue, setInvalidValue] = useState<boolean>(false)

  const handleAssetChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = event.target.value
    console.log(`tokenAddress: ${tokenAddress}`)
    const token = tokens.find((token) => token.address === tokenAddress)
    setToken(token)
  }

  const handleToChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setTxTo(value)
    try {
      console.log(`${ethers.getAddress(value)}`)
      setInvalidTo(false)
    } catch (error) {
      console.log(`Invalid to`)
      setInvalidTo(true)
    }
  }

  const handleAmountChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setTxValue(value)
    try {
      console.log(`${ethers.parseUnits(value, "ether")}`)
      setInvalidValue(false)
    } catch (error) {
      console.log(`Invalid value`)
      setInvalidValue(true)
    }
  }

  const handleSend = useCallback(async () => {
    const signer = await provider.getSigner()
    if (address.isEqual(token.address, nativeToken.address)) {
      return sendNativeToken(signer, txTo, txValue)
    }
    return sendErc20Token(signer, txTo, txValue, token)
  }, [txTo, txValue])

  return (
    <div className="text-base justify-center items-center h-auto">
      <div className="flex">
        <label className="col-span-1">Asset:</label>
        <select
          id="asset"
          value={token.address}
          className="col-span-4 border w-full outline-none border-gray-300"
          onChange={handleAssetChange}>
          {tokens.map((token) => {
            const balance = number.formatUnitsToFixed(
              token.balance,
              token.decimals
            )
            return (
              <option key={token.address} value={token.address}>
                {token.symbol}: {balance} {token.symbol}
              </option>
            )
          })}
        </select>
      </div>
      <div className="flex">
        <label className="flex-1">To:</label>
        <input
          type="text"
          id="to"
          value={`${txTo}`}
          onChange={handleToChange}
          list="suggestionTo"
          className={`border w-96 outline-none ${
            invalidTo ? "border-red-500" : "border-gray-300"
          }`}></input>
        <datalist id="suggestionTo">
          <option value={account.address}></option>
        </datalist>
      </div>
      <div className="flex">
        <label className="flex-1">Amount:</label>
        <input
          type="text"
          id="amount"
          value={`${txValue}`}
          onChange={handleAmountChange}
          className={`border w-96 outline-none ${
            invalidValue ? "border-red-500" : "border-gray-300"
          }`}></input>
      </div>
      <div className="flex">
        <button
          onClick={handleSend}
          disabled={invalidTo || invalidValue}
          className="flex-1">
          Send
        </button>
        <Link href={Path.Home} className="flex-1">
          Cancel
        </Link>
      </div>
    </div>
  )
}

const sendNativeToken = async (
  signer: ethers.JsonRpcSigner,
  to: HexString,
  value: BigNumberish
) => {
  return await signer.sendTransaction({
    to: to,
    value: ethers.parseUnits(value.toString(), "ether"),
    data: "0x"
  })
}

const sendErc20Token = async (
  signer: ethers.JsonRpcSigner,
  toAddress: HexString,
  value: BigNumberish,
  token: Token
) => {
  const erc20 = TokenClass.contractCreation(token.address, signer)
  const data = erc20.interface.encodeFunctionData("transfer", [
    toAddress,
    ethers.parseUnits(value.toString(), token.decimals)
  ])
  return await signer.sendTransaction({
    to: token.address,
    value: 0,
    data: data
  })
}
