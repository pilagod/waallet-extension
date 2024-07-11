import ArrowRightArrowLeft from "react:~assets/arrowRightArrowLeft.svg"
import ArrowUpRight from "react:~assets/arrowUpRight.svg"
import CircleXmark from "react:~assets/circleXmark.svg"

import { useAccount, useNetwork, useTransactionLogs } from "~app/storage"
import { decodeExecuteParams, decodeTransferParams } from "~app/util/calldata"
import { getChainName } from "~packages/network/util"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { TransactionStatus, type TransactionLog } from "~storage/local/state"
import type { BigNumberish, HexString } from "~typing"

const explorerUrl = "https://jiffyscan.xyz/"

export function Activity() {
  const account = useAccount()
  const txLogs = useTransactionLogs(account.id)
  return <TransactionHistory txLogs={txLogs} />
}

const TransactionHistory: React.FC<{
  txLogs: TransactionLog[]
}> = ({ txLogs }) => {
  const { chainId } = useNetwork()
  const chainName = getChainName(chainId)
  return (
    <>
      {/* Home page activity list bar */}
      <div className="w-full flex flex-col items-start">
        {txLogs.map((txLog, i) => {
          return (
            <UserOpHistoryItem key={i} txLog={txLog} chainName={chainName} />
          )
        })}
      </div>
    </>
  )
}

const UserOpHistoryItem: React.FC<{
  txLog: TransactionLog
  chainName: string
}> = ({ txLog, chainName }) => {
  const { createdAt, status } = txLog
  const creationDate = new Date(createdAt * 1000).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric"
  })
  const creationTime = new Date(createdAt * 1000).toLocaleTimeString("zh-TW", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  })
  const callData = txLog.detail.data.callData

  if (txLog.status === TransactionStatus.Succeeded) {
    const userOpHash = txLog.receipt.userOpHash
    return (
      <a
        className="w-full flex items-center"
        href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
        target="_blank">
        {/* Status and to address */}
        <Log calldata={callData} txStatus={txLog.status} />
        {/* Transaction time */}
        <TransactionTime time={creationTime} date={creationDate} />
      </a>
    )
  }

  // Others' case
  return (
    <div className="w-full flex items-center">
      {/* Status and to address */}
      <Log calldata={callData} txStatus={txLog.status} />
      {/* Transaction time */}
      <TransactionTime time={creationTime} date={creationDate} />
    </div>
  )
}

const Log: React.FC<{
  calldata: HexString
  txStatus: TransactionStatus
}> = ({ calldata, txStatus }) => {
  const { chainId, tokens, type } = useAccount()

  const { to, value: nativeValue, data } = decodeExecuteParams(type, calldata)

  let tokenName = `${getChainName(chainId).slice(0, 3)}ETH`
  let value = nativeValue
  let toAddress = to

  // Send ETH
  if (data === "0x") {
    return (
      <TokenLog tokenName={tokenName} value={value} toAddress={toAddress}>
        <StatusMark txStatus={txStatus} />
      </TokenLog>
    )
  }

  // Interact with Dapp
  const inTokenList = tokens.some((token) => {
    if (address.isEqual(token.address, to)) {
      try {
        const { to, value: tokenValue } = decodeTransferParams(data)

        tokenName = token.symbol
        value = tokenValue
        toAddress = to
        return true
      } catch (e) {
        throw new Error(`Cannot decode token transfer: ${e}`)
      }
    }
  })

  return inTokenList ? (
    <TokenLog tokenName={tokenName} value={value} toAddress={toAddress}>
      <StatusMark txStatus={txStatus} />
    </TokenLog>
  ) : (
    <ContractLog toAddress={toAddress}>
      <StatusMark txStatus={txStatus} />
    </ContractLog>
  )
}

const TokenLog: React.FC<{
  tokenName: string
  value: BigNumberish
  toAddress: HexString
  children?: React.ReactNode
}> = ({ tokenName, value, toAddress, children }) => {
  return (
    <div className="w-full flex items-center p-[14px_0px_14px_0px]">
      {/* Status and to address */}
      <div className="flex-grow flex flex-col items-start">
        {/* Status and token amount */}
        <div className="flex items-center mb-[4px]">
          <ArrowUpRight className="w-[16px] h-[16px] mr-[8px]" />
          <div className="mr-[8px] leading-[19px] text-[16px] text-[#000000]">
            Send
          </div>
          <div className="mr-[8px] leading-[19px] text-[16px] text-[#000000]">
            {number.formatUnitsToFixed(value, 18, 2)}
          </div>
          <div className="mr-[8px] leading-[19px] text-[16px] text-[#000000]">
            {tokenName}
          </div>
          {/* Status mark */}
          {children}
        </div>
        {/* To address */}
        <div className="leading-[19px] text-[16px] text-[#bbbbbb] whitespace-nowrap">
          to: {address.ellipsize(toAddress)}
        </div>
      </div>
    </div>
  )
}

const ContractLog: React.FC<{
  toAddress: HexString
  children?: React.ReactNode
}> = ({ toAddress, children }) => {
  return (
    <div className="w-full flex items-center p-[14px_0px_14px_0px]">
      {/* Status and to address */}
      <div className="flex-grow flex flex-col items-start">
        {/* Status and token amount */}
        <div className="flex items-center mb-[4px]">
          <ArrowRightArrowLeft className="w-[16px] h-[16px] mr-[8px]" />
          <div className="mr-[8px] leading-[19px] text-[16px] text-[#000000]">
            Interact with Dapp
          </div>
          {/* Status mark */}
          {children}
        </div>
        {/* To address */}
        <div className="leading-[19px] text-[16px] text-[#bbbbbb] whitespace-nowrap">
          {address.ellipsize(toAddress)}
        </div>
      </div>
    </div>
  )
}

const StatusMark: React.FC<{
  txStatus: TransactionStatus
}> = ({ txStatus }) => {
  if (
    txStatus === TransactionStatus.Sent ||
    txStatus === TransactionStatus.Pending
  ) {
    return (
      <div className="p-[4px_8px_4px_8px] rounded-[4px] bg-[#F5F5F5]">
        <div className="text-[12px] font-[500] text-[#989898]">
          Processing...
        </div>
      </div>
    )
  }

  if (
    txStatus === TransactionStatus.Failed ||
    txStatus === TransactionStatus.Reverted
  ) {
    return (
      <div className="flex items-center p-[4px_8px_4px_8px] rounded-[4px] bg-[#000000]">
        <CircleXmark className="w-[12px] h-[12px] mr-[4px]" />
        <div className="text-[12px] font-[500] text-[#FF9393]">Failed</div>
      </div>
    )
  }

  // Succeeded and others' case
  return <></>
}

const TransactionTime: React.FC<{
  date: string
  time: string
}> = ({ date, time }) => {
  return (
    <div className="flex flex-col items-end">
      <div className="mb-[4px] leading-[19px] text-[16px] text-[#000000]">
        {date}
      </div>
      <div className="leading-[19px] text-[16px] text-[#000000]">{time}</div>
    </div>
  )
}
