import * as ethers from "ethers"
import { useCallback, useContext, useState, type ChangeEvent } from "react"
import { Link } from "wouter"

import { StepBackHeader } from "~app/component/stepBackHeader"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { useProviderContext } from "~app/context/provider"
import { SendTokenContext } from "~app/context/sendTokenContext"
import { Path } from "~app/path"
import { useAccount } from "~app/storage"
import { getErc20Contract } from "~packages/network/util"
import address from "~packages/util/address"
import { type Token } from "~storage/local/state"
import type { BigNumberish, HexString } from "~typing"

const SelectToken = ({ tokens, onSelectToken }) => {
  const handleAssetChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = event.target.value
    console.log(`tokenAddress: ${tokenAddress}`)
    const token = tokens.find((token) => token.address === tokenAddress)
    onSelectToken(token)
  }

  return (
      <TokenList>
        {tokens.map((token, index) => (
          <TokenItem
            key={index}
            token={token}
            onClick={() => handleOnSelectToken(token)}
          />
        ))}
      </TokenList>
  )
}

const SelectAddress = ({ to, onChangeTo }) => {
  const [invalidTo, setInvalidTo] = useState<boolean>(false)
  const account = useAccount()

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
  )
}
// Select token -> Select address -> Send amount -> Review

export function Send() {
  const { provider } = useProviderContext()

  const { tokens, tokenSelected, step, setStep } = useContext(SendTokenContext)
  const [txTo, setTxTo] = useState<HexString>("")
  const [txValue, setTxValue] = useState<BigNumberish>("0")

  const stepsComponents = [
    <SelectToken key="step1" tokens={tokens} onSelectToken={setToken} />,
    <SelectAddress key="step2" to={txTo} onChangeTo={setTxTo} />,
    <SendAmount key="step3" amount={txValue} onChangeAmount={setTxValue} />
  ]
  const stepsTitle = ["Select Token", "Select Address", "Send Amount"]

  const handlePrevStep = useCallback(() => {
    if (step > 0) {
      setStep(step - 1)
    }
  }, [step])

  const handleNextStep = useCallback(() => {
    if (step < 2) {
      setStep(step + 1)
    }
  }, [step])

  const handleSend = useCallback(async () => {
    const signer = await provider.getSigner()
    if (address.isEqual(token.address, nativeToken.address)) {
      return sendNativeToken(signer, txTo, txValue)
    }
    return sendErc20Token(signer, txTo, txValue, token)
  }, [txTo, txValue])

  return (
    <>
      {step === 0 ? (
        <StepBackHeader title={stepsTitle[0]} href={Path.Index} />
      ) : (
        <StepBackHeader
          title={stepsTitle[step]}
          handleOnClick={handlePrevStep}
        />
      )}
      {stepsComponents[step]}
      <div className="flex">
        {step < 2 ? (
          <button onClick={handleNextStep} className="flex-1">
            Next
          </button>
        ) : (
          <>
            <Link href={Path.Home} className="flex-1">
              Cancel
            </Link>
            <button onClick={handleSend} className="flex-1">
              Send
            </button>
          </>
        )}
      </div>
    </>
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
  const erc20 = getErc20Contract(token.address, signer)
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
