import ArrowUpRight from "react:~assets/arrowUpRight.svg"
import CircleQuestion from "react:~assets/circleQuestion.svg"
import Clock from "react:~assets/clock.svg"
import OctagonXmark from "react:~assets/octagonXmark.svg"

import { useAccount, useNetwork, useTransactionLogs } from "~app/storage"
import { getChainName } from "~packages/network/util"
import address from "~packages/util/address"
import { TransactionStatus, type TransactionLog } from "~storage/local/state"

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
        {txLogs.length === 0 ? (
          <div></div>
        ) : (
          // TODO: Render based on transaction log type
          txLogs.map((txLog, i) => {
            return (
              <UserOpHistoryItem key={i} txLog={txLog} chainName={chainName} />
            )
          })
        )}
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

  if (txLog.status === TransactionStatus.Succeeded) {
    const userOpHash = txLog.receipt.userOpHash
    return (
      <a
        className="w-full flex items-center p-[14px_0px_14px_0px]"
        href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
        target="_blank">
        {/* Status and to address */}
        <div className="flex-grow flex flex-col items-start">
          {/* Status and token amount */}
          <div className="flex items-center mb-[4px]">
            <ArrowUpRight className="w-[16px] h-[16px] mr-[8px]" />
            <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              Send
            </div>
            <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              1.2
            </div>
            <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              ETH
            </div>
          </div>
          {/* To address */}
          <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#bbbbbb] whitespace-nowrap">
            to: 0x0000...00000
          </div>
        </div>
        {/* Transaction time */}
        <div>
          <div className="flex flex-col items-end">
            <div className="mb-[4px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationDate}
            </div>
            <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationTime}
            </div>
          </div>
        </div>
      </a>
    )
  }

  if (txLog.status === TransactionStatus.Failed) {
    const userOpHash = txLog.receipt.userOpHash
    return (
      <a
        className="w-full flex items-center p-[14px_0px_14px_0px]"
        href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
        target="_blank">
        {/* Status and to address */}
        <div className="flex-grow flex flex-col items-start">
          {/* Status and token amount */}
          <div className="flex items-center mb-[4px]">
            <OctagonXmark className="w-[16px] h-[16px] mr-[8px]" />
            <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              Failed
            </div>
            <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              1.2
            </div>
            <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              ETH
            </div>
          </div>
          {/* To address */}
          <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#bbbbbb] whitespace-nowrap">
            to: 0x0000...00000
          </div>
        </div>
        {/* Transaction time */}
        <div>
          <div className="flex flex-col items-end">
            <div className="mb-[4px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationDate}
            </div>
            <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationTime}
            </div>
          </div>
        </div>
      </a>
    )
  }

  if (txLog.status === TransactionStatus.Rejected) {
    return (
      <div className="w-full flex items-center p-[14px_0px_14px_0px]">
        <div className="flex-grow flex flex-col items-start">
          {/* Status and image */}
          <div className="flex items-center">
            <OctagonXmark className="w-[16px] h-[16px] mr-[8px]" />
            <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {status}
            </div>
          </div>
        </div>
        {/* Transaction time */}
        <div>
          <div className="flex flex-col items-end">
            <div className="mb-[4px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationDate}
            </div>
            <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationTime}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (txLog.status === TransactionStatus.Sent) {
    return (
      <div className="w-full flex items-center p-[14px_0px_14px_0px]">
        {/* Status and to address */}
        <div className="flex-grow flex flex-col items-start">
          {/* Status and token amount */}
          <div className="flex items-center mb-[4px]">
            <Clock className="w-[16px] h-[16px] mr-[8px]" />
            <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {status}
            </div>
            <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              1.2
            </div>
            <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              ETH
            </div>
          </div>
          {/* To address */}
          <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#bbbbbb] whitespace-nowrap">
            to: 0x0000...00000
          </div>
        </div>
        {/* Transaction time */}
        <div>
          <div className="flex flex-col items-end">
            <div className="mb-[4px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationDate}
            </div>
            <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
              {creationTime}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Others' case
  return (
    <div className="w-full flex items-center p-[14px_0px_14px_0px]">
      {/* Status and to address */}
      <div className="flex-grow flex flex-col items-start">
        {/* Status and token amount */}
        <div className="flex items-center mb-[4px]">
          <CircleQuestion className="w-[16px] h-[16px] mr-[8px]" />
          <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
            {status}
          </div>
          <div className="mr-[8px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
            1.2
          </div>
          <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
            ETH
          </div>
        </div>
        {/* To address */}
        <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#bbbbbb] whitespace-nowrap">
          to: 0x0000...00000
        </div>
      </div>
      {/* Transaction time */}
      <div>
        <div className="flex flex-col items-end">
          <div className="mb-[4px] leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
            {creationDate}
          </div>
          <div className="leading-[19px] text-[16px] font-[Inter] font-[400] text-[#000000]">
            {creationTime}
          </div>
        </div>
      </div>
    </div>
  )
}
