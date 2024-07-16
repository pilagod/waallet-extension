import * as ethers from "ethers"
import { useContext, useState, type ChangeEvent } from "react"

import { StepBackHeader } from "~app/component/stepBackHeader"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { SendTokenContext } from "~app/context/sendTokenContext"
import { Path } from "~app/path"
import { useAccount } from "~app/storage"
import { type Token } from "~storage/local/state"
import type { BigNumberish, HexString } from "~typing"

const SelectToken = () => {
  const { tokens, setTokenSelected, step, setStep } =
    useContext(SendTokenContext)
  const handleOnSelectToken = (token: Token) => {
    setTokenSelected(token)
    setStep(step + 1)
  }
  return (
    <>
      <StepBackHeader title="Select Token" href={Path.Index} />
      <TokenList>
        {tokens.map((token, index) => (
          <TokenItem
            key={index}
            token={token}
            onClick={() => handleOnSelectToken(token)}
          />
        ))}
      </TokenList>
    </>
  )
}

const SelectAddress = ({ to, onChangeTo }) => {
  const [invalidTo, setInvalidTo] = useState<boolean>(false)
  const account = useAccount()
  const { setTokenSelected, step, setStep } = useContext(SendTokenContext)

  const handleToChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onChangeTo(value)
    try {
      console.log(`${ethers.getAddress(value)}`)
      setInvalidTo(false)
    } catch (error) {
      console.log(`Invalid to`)
      setInvalidTo(true)
    }
  }
  return (
    <>
      <StepBackHeader
        title="Select Address"
        handleOnClick={() => {
          setTokenSelected(null)
          setStep(step - 1)
        }}
      />
      <div className="flex">
        <label className="flex-1">To:</label>
        <input
          type="text"
          id="to"
          value={`${to}`}
          onChange={handleToChange}
          list="suggestionTo"
          className={`border w-96 outline-none ${
            invalidTo ? "border-red-500" : "border-gray-300"
          }`}></input>
        <datalist id="suggestionTo">
          <option value={account.address}></option>
        </datalist>
      </div>
      <button
        onClick={() => {
          setStep(step + 1)
        }}
        className="flex-1">
        Next
      </button>
    </>
  )
}

const SendAmount = ({ amount, onChangeAmount }) => {
  const [invalidValue, setInvalidValue] = useState<boolean>(false)

  const handleAmountChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onChangeAmount(value)
    try {
      console.log(`${ethers.parseUnits(value, "ether")}`)
      setInvalidValue(false)
    } catch (error) {
      console.log(`Invalid value`)
      setInvalidValue(true)
    }
  }

  return (
    <>
      <StepBackHeader
        title="Send Amount"
        handleOnClick={() => {
          //TODO
        }}
      />
      <div className="flex">
        <label className="flex-1">Amount:</label>
        <input
          type="text"
          id="amount"
          value={`${amount}`}
          onChange={handleAmountChange}
          className={`border w-96 outline-none ${
            invalidValue ? "border-red-500" : "border-gray-300"
          }`}></input>
      </div>
      <button
        onClick={() => {
          //TODO
        }}
        className="flex-1">
        Next
      </button>
    </>
  )
}
// Select token -> Select address -> Send amount -> Review
export function Send() {
  const { step } = useContext(SendTokenContext)
  const [txTo, setTxTo] = useState<HexString>("")
  const [txValue, setTxValue] = useState<BigNumberish>("0")

  const stepsComponents = [
    <SelectToken key="step1" />,
    <SelectAddress key="step2" to={txTo} onChangeTo={setTxTo} />,
    <SendAmount key="step3" amount={txValue} onChangeAmount={setTxValue} />
  ]

  return stepsComponents[step]
}
