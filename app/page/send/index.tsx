import * as ethers from "ethers"
import { ERC20Contract } from "packages/contract/erc20"
import { useCallback, useContext, useState, type ChangeEvent } from "react"
import { useParams } from "wouter"

import { AccountItem } from "~app/component/accountItem"
import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { ProviderContext } from "~app/context/provider"
import { useAccounts, useNetwork, useTokens } from "~app/hook/storage"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { type AccountToken } from "~storage/local/state"
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
  token: AccountToken
) => {
  const data = ERC20Contract.encodeTransferData(
    toAddress,
    ethers.parseUnits(value.toString(), token.decimals)
  )
  return await signer.sendTransaction({
    to: token.address,
    value: 0,
    data: data
  })
}

const SelectToken = ({ setTokenSelected }) => {
  const tokens = useTokens()
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
  const accounts = useAccounts()

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
      <div className="py-[24px] h-[311px] overflow-y-scroll no-scrollbar">
        <h2 className="text-[16px]">Transaction History</h2>
        {/* TODO: Replace with actual transaction history */}
        {accounts.map((account, index) => {
          return (
            <button
              className="w-full"
              key={index}
              onClick={() => {
                setInputTo(account.address)
              }}>
              <AccountItem address={account.address} />
            </button>
          )
        })}
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

const SendAmount = ({
  txInfo,
  onStepBack
}: {
  txInfo: {
    token: AccountToken
    txTo: HexString
  }
  onStepBack: () => void
}) => {
  const { token, txTo } = txInfo

  const { provider } = useContext(ProviderContext)
  const network = useNetwork()

  const [inputAmount, setInputAmount] = useState<string>("0")

  const handleAmountChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputAmount(value)
  }

  const handleSend = useCallback(async () => {
    const signer = await provider.getSigner()
    if (
      address.isEqual(
        token.address,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      )
    ) {
      return sendNativeToken(signer, txTo, inputAmount)
    }
    return sendErc20Token(signer, txTo, inputAmount, token)
  }, [txTo, inputAmount])

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
        <div className="text-[24px]">{network.tokenSymbol}</div>
      </div>
      <Divider />
      <div>
        <h2 className="text-[16px] py-[12px]">Balance</h2>
        <div className="flex items-center gap-[16px]">
          <div className="w-full">
            <TokenItem token={token} />
          </div>
          <button
            className="text-[16px] p-[8px_20px] border border-solid border-black h-[35px] rounded-[99px]"
            onClick={() => {
              const balance = number.formatUnitsToFixed(
                token.balance,
                token.decimals,
                2
              )
              setInputAmount(balance)
            }}>
            Max
          </button>
        </div>
        <Button
          text="Next"
          className="text-[16px] my-[22px]"
          onClick={handleSend}
          variant="black"
          disabled={!isValidValue(inputAmount, token.decimals)}
        />
      </div>
    </>
  )
}
// Select token -> Select address -> Send amount -> Review
export function Send() {
  const params = useParams<{ tokenAddress?: string }>()
  const tokens = useTokens()
  const initialToken = params.tokenAddress
    ? tokens.find((token) => token.address === params.tokenAddress)
    : null
  const [tokenSelected, setTokenSelected] =
    useState<Nullable<AccountToken>>(initialToken)
  const [txTo, setTxTo] = useState<HexString>("")

  if (!tokenSelected) {
    return <SelectToken key="step1" setTokenSelected={setTokenSelected} />
  }

  if (!txTo) {
    return (
      <SelectAddress
        key="step2"
        onStepBack={() => {
          setTokenSelected(null)
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
      txInfo={{ token: tokenSelected, txTo }}
    />
  )
}
