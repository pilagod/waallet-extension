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
import type { BigNumberish } from "~typing"

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

  const tokenData = {
    tokenSymbol: `${chainName}ETH`,
    tokenValue: value,
    tokenTo: to
  }

  // Check if the transaction "to" address is a stored token
  const token = tokens.find((token) => address.isEqual(token.address, to))

  // If a token is found, consider it an ERC20 token transfer
  if (token) {
    const { to: tokenTo, value: tokenValue } = decodeTransferParams(data)
    tokenData.tokenSymbol = token.symbol
    tokenData.tokenValue = tokenValue
    tokenData.tokenTo = tokenTo
  }

  // Check if it's a token send or contract interaction
  const topicType = data === "0x" || token ? "send" : "contract"

  if (
    status === TransactionStatus.Succeeded ||
    status === TransactionStatus.Reverted
  ) {
    const link = `${explorerUrl}userOpHash/${txLog.receipt.userOpHash}?network=${chainName}`
    return (
      <div className="w-full flex items-center py-[13px] justify-between">
        <div className="flex flex-col items-start gap-[8px]">
          {/* Activity Topic element */}
          {topic[topicType]}
          {/* Activity Time element */}
          <Time date={creationDate} time={creationTime} link={link} />
        </div>
        {/* Activity Status element */}
        <Status
          status={status}
          symbol={tokenData.tokenSymbol}
          value={tokenData.tokenValue}
        />
      </div>
    )
  }

  // Others' case
  return (
    <div className="w-full flex items-center py-[13px] justify-between">
      <div className="flex flex-col items-start gap-[8px]">
        {/* Activity Topic element */}
        {topic[topicType]}
        {/* Activity Time element */}
        <Time date={creationDate} time={creationTime} />
      </div>
      {/* Activity Status element */}
      <Status status={status} />
    </div>
  )
}

type TopicType = "send" | "contract" | "receive"

const TopicTemplate: React.FC<{
  Icon: React.ComponentType<{ className?: string }>
  topic: string
}> = ({ Icon, topic }) => {
  return (
    <div className="flex items-center">
      <Icon className="w-[16px] h-[16px] mr-[8px]" />
      <div className="text-[16px] text-[#000000]">{topic}</div>
    </div>
  )
}

const topic: Record<TopicType, JSX.Element> = {
  send: <TopicTemplate Icon={ArrowUpRight} topic="Send" />,
  contract: (
    <TopicTemplate Icon={ArrowRightArrowLeft} topic="Contract interaction" />
  ),
  receive: <TopicTemplate Icon={ArrowDownLeft} topic="Receive" />
}

const Status: React.FC<{
  status: TransactionStatus
  symbol?: string
  value?: BigNumberish
}> = ({ status, symbol, value }) => {
  if (symbol && value) {
    switch (status) {
      case TransactionStatus.Succeeded:
        return (
          <div className="flex items-center">
            <div className="text-[16px] text-[#FF5151] whitespace-nowrap">
              - {number.formatUnitsToFixed(value, 18, 4)} {symbol}
            </div>
          </div>
        )
      // TODO: Handle receive case

      default:
        break
    }
  }

  switch (status) {
    case TransactionStatus.Failed:
    case TransactionStatus.Reverted:
      return (
        <div className="flex items-center">
          <CircleXmark className="w-[14px] h-[14px] mr-[4px]" />
          <div className="text-[16px] text-[#FF5151]">Failed</div>
        </div>
      )

    case TransactionStatus.Sent:
    case TransactionStatus.Pending:
      return (
        <div className="flex items-center">
          <Clock className="w-[14px] h-[14px] mr-[4px]" />
          <div className="text-[16px] text-[#466BFF]">Processing...</div>
        </div>
      )
    default:
      return <></>
  }
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
