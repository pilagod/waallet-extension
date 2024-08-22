import * as ethers from "ethers"
import { useCallback, useContext, useState, type ChangeEvent } from "react"
import { useParams } from "wouter"

import { AccountItem } from "~app/component/accountItem"
import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { ScrollableWrapper } from "~app/component/scrollableWrapper"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { ProviderContext } from "~app/context/provider"
import { useAccounts, useTokens } from "~app/hook/storage"
import { ERC20Contract } from "~packages/eip/20/contract"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import { type AccountToken } from "~storage/local/state"
import type { HexString, Nullable } from "~typing"

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
  provider: ethers.BrowserProvider,
  to: HexString,
  value: bigint
) => {
  return await provider.send(WaalletRpcMethod.eth_sendTransaction, [
    {
      to,
      value: number.toHex(value),
      data: "0x"
    }
  ])
}

const sendErc20Token = async (
  provider: ethers.BrowserProvider,
  toAddress: HexString,
  value: bigint,
  token: AccountToken
) => {
  const data = ERC20Contract.encodeTransferData(toAddress, value)

  return await provider.send(WaalletRpcMethod.eth_sendTransaction, [
    {
      to: token.address,
      value: 0,
      data
    }
  ])
}

const SelectToken = ({ setTokenSelected }) => {
  const tokens = useTokens()
  return (
    <>
      <StepBackHeader title="Select Token" />
      <ScrollableWrapper className="h-[483px]">
        <TokenList className="pt-[16px]">
          {tokens.map((token, index) => (
            <button
              className="w-full px-[16px] hover:bg-[#F5F5F5] cursor-pointer"
              key={index}
              onClick={() => setTokenSelected(token)}>
              <TokenItem token={token} />
            </button>
          ))}
        </TokenList>
      </ScrollableWrapper>
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
      <ScrollableWrapper className="h-[311px] py-[24px]">
        <h2 className="text-[16px] px-[16px] py-[12px]">Transaction History</h2>
        {/* TODO: Replace with actual transaction history */}
        {accounts.map((account, index) => {
          return (
            <button
              className="w-full p-[16px] hover:bg-[#F5F5F5] cursor-pointer"
              key={index}
              onClick={() => {
                setInputTo(account.address)
              }}>
              <AccountItem address={account.address} />
            </button>
          )
        })}
      </ScrollableWrapper>
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

  const [inputAmount, setInputAmount] = useState<string>("0")
  const [transferAmount, setTransferAmount] = useState(0n)

  const handleAmountChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputAmount(value)
    setTransferAmount(ethers.parseUnits(value, token.decimals))
  }

  const handleSend = useCallback(async () => {
    if (
      address.isEqual(
        token.address,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      )
    ) {
      return sendNativeToken(provider, txTo, transferAmount)
    }
    return sendErc20Token(provider, txTo, transferAmount, token)
  }, [txTo, transferAmount])

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
        <div className="text-[24px]">{token.symbol}</div>
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
              setInputAmount(
                number.formatUnitsToFixed(token.balance, token.decimals, 2)
              )
              setTransferAmount(number.toBigInt(token.balance))
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
