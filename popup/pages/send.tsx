import * as ethers from "ethers"
import { useCallback, useContext, useState, type ChangeEvent } from "react"
import { useLocation } from "wouter"

import { ProviderCtx } from "~popup/ctx/provider"
import { PopupPath } from "~popup/util/page"
import type { BigNumberish, HexString } from "~typing"

export function Send() {
  const providerCtx = useContext(ProviderCtx)
  const [_, setLocation] = useLocation()

  // Input state
  const [to, setTo] = useState<string>("")
  const [amount, setAmount] = useState<string>("0")
  const [toBorderColor, setToBorderColor] = useState<string>("border-gray-300")
  const [amountBorderColor, setAmountBorderColor] =
    useState<string>("border-gray-300")

  // Button state
  const [sendLock, setSendLock] = useState<boolean>(false)

  const inputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const { id, value } = event.target
      switch (id) {
        case InputId.to:
          setTo(value)
          try {
            console.log(`${ethers.getAddress(value)}`)
            setToBorderColor("border-gray-300")
            setSendLock(false)
          } catch (error) {
            setToBorderColor("border-red-500")
            setSendLock(true)
          }
          break
        case InputId.amount:
          setAmount(value)
          try {
            console.log(`${ethers.parseUnits(value, "ether")}`)
            setAmountBorderColor("border-gray-300")
            setSendLock(false)
          } catch (error) {
            setAmountBorderColor("border-red-500")
            setSendLock(true)
          }
          break
        default:
          break
      }
      console.log(`Input: ${id} = ${value}`)
    },
    []
  )

  const handleSend = async () => {}

  return (
    <div className="text-base justify-center items-center h-auto">
      <div className="flex">
        <label className="flex-1">To:</label>
        <input
          type="text"
          id={`${InputId.to}`}
          value={`${to}`}
          onChange={inputChange}
          className={`border-2 ${toBorderColor} w-96 outline-none`}></input>
      </div>
      <div className="flex">
        <label className="flex-1">Amount:</label>
        <input
          type="text"
          id={`${InputId.amount}`}
          value={`${amount}`}
          onChange={inputChange}
          className={`border ${amountBorderColor} w-96 outline-none`}></input>
      </div>
      <div className="flex">
        <button onClick={handleSend} disabled={sendLock} className="flex-1">
          Send
        </button>
        <button onClick={() => setLocation(PopupPath.info)} className="flex-1">
          Cancel
        </button>
      </div>

      {/* <button onClick={handleTransfer}>Transfer</button> */}
    </div>
  )
}

enum InputId {
  to = "to",
  amount = "amount"
}
