import * as ethers from "ethers"
import { useCallback, useState, type ChangeEvent } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~app/context/provider"
import { NavbarLayout } from "~app/layout/navbar"
import { Path } from "~app/path"
import { useAccount, useTokens } from "~app/storage"
import { getErc20Contract } from "~packages/network/util"
import { type Token } from "~storage/local"
import type { BigNumberish, HexString } from "~typing"

export function Send() {
  const ethAddress: HexString = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"

  const { provider } = useProviderContext()
  const account = useAccount()
  const tokens = useTokens()

  const [token, setToken] = useState<Token>({
    address: tokens[0].address,
    balance: tokens[0].balance,
    symbol: tokens[0].symbol,
    decimals: tokens[0].decimals
  })
  const [txHash, setTxHash] = useState<HexString>("")
  const [txTo, setTxTo] = useState<HexString>("")
  const [txValue, setTxValue] = useState<BigNumberish>("0")
  const [invalidTo, setInvalidTo] = useState<boolean>(false)
  const [invalidValue, setInvalidValue] = useState<boolean>(false)
  const [isEth, setIsEth] = useState<boolean>(token.address === ethAddress)

  const handleAssetChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = event.target.value
    const t = tokens.find((token) => token.address === tokenAddress)
    setToken(t)
    setIsEth(t.address === ethAddress)
  }

  const handleToChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setTxTo(value)
    try {
      console.log(`${ethers.getAddress(value)}`)
      setInvalidTo(false)
    } catch (error) {
      console.warn(`Invalid to address: ${error}`)
      setInvalidTo(true)
    }
  }

  const handleAmountChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setTxValue(value)
    try {
      console.log(`${ethers.parseUnits(value, token.decimals)}`)
      setInvalidValue(false)
    } catch (error) {
      console.warn(`Invalid value: ${error}`)
      setInvalidValue(true)
    }
  }

  const handleSend = useCallback(async () => {
    const signer = await provider.getSigner()
    const erc20 = getErc20Contract(token.address, provider)
    const to = isEth ? txTo : token.address
    const value = isEth ? ethers.parseUnits(txValue.toString(), "ether") : 0
    const data = isEth
      ? "0x"
      : erc20.interface.encodeFunctionData("transfer", [
          txTo,
          ethers.parseUnits(txValue.toString(), token.decimals)
        ])

    const txResult = await signer.sendTransaction({
      to: to,
      value: value,
      data: data
    })
    // TODO: Need to avoid Popup closure
    setTxHash(txResult.hash)
  }, [txTo, txValue])

  return (
    <NavbarLayout>
      <div className="text-base justify-center items-center h-auto">
        <div className="flex">
          <label className="flex-1">Asset:</label>
          <select
            id="asset"
            value={token.address}
            className="border w-96 outline-none border-gray-300"
            onChange={handleAssetChange}>
            {tokens.map((token) => {
              const balance = parseFloat(
                ethers.formatUnits(
                  ethers.toBeHex(token.balance),
                  ethers.toNumber(token.decimals)
                )
              ).toFixed(6)
              return (
                <option key={token.address} value={token.address}>
                  {token.symbol}: {balance} {token.symbol}
                </option>
              )
            })}
          </select>
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
          <Link href={Path.Info} className="flex-1">
            Cancel
          </Link>
        </div>
        {txHash && (
          <div className="flex">
            <label className="flex-1">TxHash:</label>
            <span className="flex-1">{txHash}</span>
          </div>
        )}
      </div>
    </NavbarLayout>
  )
}
