import * as ethers from "ethers"
import { useCallback, useEffect, useState, type ChangeEvent } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~popup/context/provider"
import { PopupPath } from "~popup/util/page"
import type { BigNumberish, HexString } from "~typing"

export function Send() {
  const { provider } = useProviderContext()
  const [txHash, setTxHash] = useState<HexString>("")

  // Input state
  const [txTo, setTxTo] = useState<HexString>("")
  const [txToSuggestions, setTxToSuggestions] = useState<HexString[]>([""])
  const [txValue, setTxValue] = useState<BigNumberish>("0")
  const [invalidTo, setInvalidTo] = useState<boolean>(false)
  const [invalidValue, setInvalidValue] = useState<boolean>(false)

  useEffect(() => {
    const asyncFn = async () => {
      const [account] = await provider.listAccounts()
      setTxToSuggestions([account.address])
    }
    asyncFn()
  }, [])

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
    const [account] = await provider.listAccounts()
    const signer = await provider.getSigner()
    const txResult = await signer.sendTransaction({
      from: account.address,
      to: ethers.getAddress(txTo),
      value: ethers.parseUnits(txValue.toString(), "ether")
    })
    // TODO: Need to avoid Popup closure
    setTxHash(txResult.hash)
  }, [txTo, txValue])

  return (
    <div className="text-base justify-center items-center h-auto">
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
          {txToSuggestions.map((to, index) => {
            return <option key={index} value={to} />
          })}
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
        <Link href={PopupPath.info} className="flex-1">
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
  )
}
