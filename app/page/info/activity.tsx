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
      <div className="w-[390px] flex flex-col items-start">
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
      <>
        {/* Transaction status is succeeded */}
        <a
          className="flex items-center"
          href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
          target="_blank">
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* Status image */}
              <ArrowUpRight className="w-[16px] h-[16px] mr-[8px]" />
              {/* Status */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
                Send
              </div>
              {/* Balance */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
                1.2
              </div>
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                ETH
              </div>
            </div>
            {/* To address */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
              to: 0x0000...00000
            </div>
          </div>
          {/* Transaction time */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            <div className="flex flex-col items-end">
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationTime}
              </div>
            </div>
          </div>
        </a>
      </>
    )
  }

  if (txLog.status === TransactionStatus.Failed) {
    const userOpHash = txLog.receipt.userOpHash
    return (
      <>
        {/* Transaction status is failed */}
        <a
          className="flex items-center"
          href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
          target="_blank">
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* Status image */}
              <OctagonXmark className="w-[16px] h-[16px] mr-[8px]" />
              {/* Status */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
                Failed
              </div>
              {/* Balance */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
                1.2
              </div>
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                ETH
              </div>
            </div>
            {/* To address */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
              to: 0x0000...00000
            </div>
          </div>
          {/* Transaction time */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            <div className="flex flex-col items-end">
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationTime}
              </div>
            </div>
          </div>
        </a>
      </>
    )
  }

  if (txLog.status === TransactionStatus.Rejected) {
    return (
      <>
        {/* Transaction status is rejected */}
        <div className="flex items-center">
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* Status image */}
              <OctagonXmark className="w-[16px] h-[16px] mr-[8px]" />
              {/* Status */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
                {status}
              </div>
            </div>
          </div>
          {/* Transaction time */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            <div className="flex flex-col items-end">
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationTime}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (txLog.status === TransactionStatus.Sent) {
    return (
      <>
        {/* Transaction status is sent */}
        <div className="flex items-center">
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* Status image */}
              <Clock className="w-[16px] h-[16px] mr-[8px]" />
              {/* Status */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
                {status}
              </div>
              {/* Balance */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
                1.2
              </div>
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                ETH
              </div>
            </div>
            {/* To address */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
              to: 0x0000...00000
            </div>
          </div>
          {/* Transaction time */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            <div className="flex flex-col items-end">
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationTime}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Others' transaction status case */}
      <div className="flex items-center">
        <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
          <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
            {/* Status image */}
            <CircleQuestion className="w-[16px] h-[16px] mr-[8px]" />
            {/* Status */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
              {status}
            </div>
            {/* Balance */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mr-[8px]">
              1.2
            </div>
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
              ETH
            </div>
          </div>
          {/* To address */}
          <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
            to: 0x0000...00000
          </div>
        </div>
        {/* Transaction time */}
        <div className="w-[81px] m-[14px_16px_14px_0px]">
          <div className="flex flex-col items-end">
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
              {creationDate}
            </div>
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
              {creationTime}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
