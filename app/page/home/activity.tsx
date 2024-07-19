import ArrowDownLeft from "react:~assets/arrowDownLeft.svg"
import ArrowRightArrowLeft from "react:~assets/arrowRightArrowLeft.svg"
import ArrowUpRight from "react:~assets/arrowUpRight.svg"
import ArrowUpRightFromSquare from "react:~assets/arrowUpRightFromSquare.svg"
import CircleXmark from "react:~assets/circleXmark.svg"
import Clock from "react:~assets/clock.svg"

import { useAccount, useNetwork, useTransactionLogs } from "~app/storage"
import { decodeExecuteParams, decodeTransferParams } from "~app/util/calldata"
import { getChainName } from "~packages/network/util"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { TransactionStatus, type TransactionLog } from "~storage/local/state"
import type { BigNumberish, HexString } from "~typing"

const explorerUrl = "https://jiffyscan.xyz/"

// Activity = Topic + Time + Status elements
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

type TokenTransferInfo = {
  symbol: string
  value: BigNumberish
  to: HexString
}

const UserOpHistoryItem: React.FC<{
  txLog: TransactionLog
  chainName: string
}> = ({ txLog, chainName }) => {
  const { tokens, type } = useAccount()
  const { createdAt, status, detail } = txLog
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
  const { to, value, data } = decodeExecuteParams(type, detail.data.callData)

  const tokenInfo: TokenTransferInfo = {
    symbol: `${chainName}ETH`,
    value,
    to
  }

  // Check if the transaction "to" address is a stored token
  const tokenStored = tokens.find((token) => address.isEqual(token.address, to))

  // If a token is found, consider it an ERC20 token transfer
  if (tokenStored) {
    try {
      const { to: tokenTo, value: tokenValue } = decodeTransferParams(data)
      tokenInfo.symbol = tokenStored.symbol
      tokenInfo.value = tokenValue
      tokenInfo.to = tokenTo
      // TODO: Handling non-transfer actions
    } catch (e) {
      console.warn(`[app] Account doing non-transfer actions: ${e.message}`)
    }
  }

  // Check if it's a token send or contract interaction
  const topicType =
    data === "0x" || tokenStored
      ? TopicStatus.Send
      : TopicStatus.ContractInteraction

  if (
    status === TransactionStatus.Succeeded ||
    status === TransactionStatus.Reverted
  ) {
    const link = `${explorerUrl}userOpHash/${txLog.receipt.userOpHash}?network=${chainName}`
    return (
      <div className="w-full flex items-center py-[13px] justify-between">
        <div className="flex flex-col items-start gap-[8px]">
          {/* Activity Topic element */}
          {topics[topicType]}
          {/* Activity Time element */}
          <Time date={creationDate} time={creationTime} link={link} />
        </div>
        {/* Activity Status element */}
        <Status status={status} tokenInfo={tokenInfo} />
      </div>
    )
  }

  // Others' case
  return (
    <div className="w-full flex items-center py-[13px] justify-between">
      <div className="flex flex-col items-start gap-[8px]">
        {/* Activity Topic element */}
        {topics[topicType]}
        {/* Activity Time element */}
        <Time date={creationDate} time={creationTime} />
      </div>
      {/* Activity Status element */}
      <Status status={status} />
    </div>
  )
}

enum TopicStatus {
  Send = "Send",
  ContractInteraction = "Contract interaction",
  Receive = "Receive"
}

const TopicTemplate: React.FC<{
  Icon: React.ComponentType<{ className?: string }>
  topic: TopicStatus
}> = ({ Icon, topic }) => {
  return (
    <div className="flex items-center">
      <Icon className="w-[16px] h-[16px] mr-[8px]" />
      <div className="text-[16px] text-[#000000]">{topic}</div>
    </div>
  )
}

const topics: Record<TopicStatus, JSX.Element> = {
  [TopicStatus.Send]: (
    <TopicTemplate Icon={ArrowUpRight} topic={TopicStatus.Send} />
  ),
  [TopicStatus.ContractInteraction]: (
    <TopicTemplate
      Icon={ArrowRightArrowLeft}
      topic={TopicStatus.ContractInteraction}
    />
  ),
  [TopicStatus.Receive]: (
    <TopicTemplate Icon={ArrowDownLeft} topic={TopicStatus.Receive} />
  )
}

const Status: React.FC<{
  status: TransactionStatus
  tokenInfo?: TokenTransferInfo
}> = ({ status, tokenInfo }) => {
  if (tokenInfo && status === TransactionStatus.Succeeded) {
    return (
      <div className="flex items-center">
        <div className="text-[16px] font-[600] text-[#FF5151] whitespace-nowrap">
          - {number.formatUnitsToFixed(tokenInfo.value, 18, 4)}{" "}
          {tokenInfo.symbol}
        </div>
      </div>
    )
  }
  // TODO: Handle receive case

  const isFailed =
    status === TransactionStatus.Failed || status === TransactionStatus.Reverted

  return (
    <div className="flex items-center">
      {isFailed ? (
        <CircleXmark className="w-[14px] h-[14px] mr-[4px]" />
      ) : (
        <Clock className="w-[14px] h-[14px] mr-[4px]" />
      )}
      <div
        className={`text-[16px] font-[500] ${
          isFailed ? "text-[#FF5151]" : "text-[#466BFF]"
        }`}>
        {isFailed ? "Failed" : "Processing..."}
      </div>
    </div>
  )
}

const Time: React.FC<{
  date: string
  time: string
  link?: string
}> = ({ date, time, link }) => {
  if (link) {
    return (
      <a className="flex items-center" href={link} target="_blank">
        <div className="text-[14px] text-[#989898] mr-[4px]">
          {date} {time}
        </div>
        <ArrowUpRightFromSquare className="w-[14px] h-[14px]" />
      </a>
    )
  }

  return (
    <div className="flex items-center">
      <div className="text-[14px] text-[#989898]">
        {date} {time}
      </div>
    </div>
  )
}
