import * as ethers from "ethers"
import { useState, type ChangeEvent } from "react"
import { useRoute } from "wouter"
import { navigate } from "wouter/use-hash-location"

import { AccountItem } from "~app/component/accountItem"
import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { Path } from "~app/path"
import { getUserTokens } from "~app/util/getUserTokens"
import { type Token } from "~storage/local/state"
import type { BigNumberish, HexString, Nullable } from "~typing"

const isValidTo = (to: string) => {
  try {
    ethers.getAddress(to)
    return true
  } catch (error) {
    return false
  }
}

const SelectToken = ({ setTokenSelected }) => {
  const tokens = getUserTokens()
  return (
    <>
      <StepBackHeader title="Select Token" />
      <TokenList className="pt-[16px]">
        {tokens.map((token, index) => (
          <TokenItem
            key={index}
            token={token}
            onClick={() => {
              setTokenSelected(token)
              navigate(`/send/${token.address}`)
            }}
          />
        ))}
      </TokenList>
    </>
  )
}

const SelectAddress = ({ setTokenSelected, setTxTo }) => {
  const [inputTo, setInputTo] = useState<HexString>("")

  const handleToChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputTo(value)
  }
  return (
    <>
      <StepBackHeader
        title="Select Address"
        onStepBack={() => {
          setTokenSelected(null)
          navigate("/send/0x")
        }}>
        <input
          type="text"
          id="to"
          value={inputTo}
          onChange={handleToChange}
          className="width-full border-solid border-black border-[2px] rounded-[16px] p-[16px] text-[16px]"
          placeholder="Enter address"
          required
        />
      </StepBackHeader>
      <div className="flex flex-col py-[24px] h-[311px]">
        <h2 className="text-[16px]">Transaction History</h2>
        {/* TODO: Replace with actual transaction history */}
        <div>
          <button
            onClick={() => {
              setInputTo("0x094e5164f1730eaef2f57015aef7e6c3e266c773")
            }}>
            <AccountItem
              address={"0x094e5164f1730eaef2f57015aef7e6c3e266c773"}
            />
          </button>
        </div>
      </div>
      <Divider />
      <Button
        text="Next"
        disabled={!isValidTo(inputTo)}
        onClick={() => {
          setTxTo(inputTo)
        }}
        variant="black"
        className="my-[22.5px] text-[16px]"
      />
    </>
  )
}

const SendAmount = ({ amount, setTxTo, onChangeAmount }) => {
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
        onStepBack={() => {
          setTxTo("")
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
  const [, params] = useRoute<{
    tokenAddress: string
  }>(Path.Send)
  const tokens = getUserTokens()
  const [tokenSelected, setTokenSelected] = useState<Nullable<Token>>(null)
  const [txTo, setTxTo] = useState<HexString>("")
  const [txValue, setTxValue] = useState<BigNumberish>("0")

  if (tokenSelected === null && params.tokenAddress) {
    const token = tokens.find((token) => token.address === params.tokenAddress)
    if (token) {
      setTokenSelected(token)
    }
  }

  if (!tokenSelected) {
    return <SelectToken key="step1" setTokenSelected={setTokenSelected} />
  }

  if (!txTo) {
    return (
      <SelectAddress
        key="step2"
        setTokenSelected={setTokenSelected}
        setTxTo={setTxTo}
      />
    )
  }

  return (
    <SendAmount
      key="step3"
      setTxTo={setTxTo}
      amount={txValue}
      onChangeAmount={setTxValue}
    />
  )
}
