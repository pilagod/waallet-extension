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

const isValidValue = (value: string, decimals: number) => {
  try {
    const amount = ethers.parseUnits(value, decimals)
    return amount >= 0
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
          <button
            className="w-full"
            key={index}
            onClick={() => setTokenSelected(token)}>
            <TokenItem token={token} />
          </button>
        ))}
      </TokenList>
    </>
  )
}

const SelectAddress = ({ onStepBack, setTxTo }) => {
  const [inputTo, setInputTo] = useState<HexString>("")

  const handleToChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputTo(value)
  }
  return (
    <>
      <StepBackHeader title="Select Address" onStepBack={onStepBack}>
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

const SendAmount = ({ tokenSelected, onStepBack, setTxValue }) => {
  const [inputAmount, setInputAmount] = useState<string>("0")

  const handleAmountChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputAmount(value)
  }

  return (
    <>
      <StepBackHeader title="Send Amount" onStepBack={onStepBack} />
      <div className="flex flex-col items-center justify-center h-[270px] py-[16px] gap-[8px]">
        <input
          type="text"
          id="amount"
          value={inputAmount}
          onChange={handleAmountChange}
          className="text-center text-[64px] focus:outline-none max-w-[390px]"
        />
        <div className="text-[24px]">ETH</div>
      </div>
      <Divider />
      <div>
        <h2 className="text-[16px] py-[12px]">Balance</h2>
        <div className="flex items-center gap-[16px]">
          <button className="text-[16px] p-[8px_20px] border border-solid border-black h-[35px] rounded-[99px] ">
          <div className="w-full">
            <TokenItem token={token} />
          </div>
            Max
          </button>
        </div>
        <Button
          text="Next"
          className="text-[16px] mt-[65px] mb-[22.5px]"
          onClick={() => {
            setTxValue(inputAmount)
          }}
          variant="black"
          disabled={!isValidValue(inputAmount, token.decimals)}
        />
      </div>
    </>
  )
}
// Select token -> Select address -> Send amount -> Review
export function Send() {
  const [, params] = useRoute<{
    tokenAddress: string
  }>(`${Path.Send}/:tokenAddress`)
  const tokens = getUserTokens()
  const [tokenSelected, setTokenSelected] = useState<Nullable<Token>>(null)
  const [txTo, setTxTo] = useState<HexString>("")
  const [txValue, setTxValue] = useState<BigNumberish>("0")

  if (tokenSelected === null && params?.tokenAddress) {
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
        onStepBack={() => {
          setTokenSelected(null)
          navigate(Path.Send)
        }}
        setTxTo={setTxTo}
      />
    )
  }

  return (
    <SendAmount
      key="step3"
      onStepBack={() => {
        setTxTo("")
      }}
      tokenSelected={tokenSelected}
      setTxValue={setTxValue}
    />
  )
}
