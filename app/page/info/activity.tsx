import Close5 from "react:~assets/close5.svg"
import SystemHelp from "react:~assets/systemHelp.svg"
import Time from "react:~assets/time.svg"
import UpRight from "react:~assets/upRight.svg"

import { useAccount, useNetwork, useTransactionLogs } from "~app/storage"
import { getChainName } from "~packages/network/util"
import address from "~packages/util/address"
import { TransactionStatus, type TransactionLog } from "~storage/local"

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
      {/* Activity list */}
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
        {/* Activity */}
        <a
          className="flex items-center"
          href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
          target="_blank">
          {/* Frame 12 */}
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            {/* Frame 9 txLog.status === TransactionStatus.Succeeded */}
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* 24-up right */}
              <UpRight className="w-[16px] h-[16px] m-[0px_8px_0px_0px]" />
              {/* Send */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
                Send
              </div>
              {/* 1.2 */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
                1.2
              </div>
              {/* ETH */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                ETH
              </div>
            </div>
            {/* to: */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
              to: 0x0000...00000
            </div>
          </div>
          {/* Frame 16 */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            {/* Frame 13 */}
            <div className="flex flex-col items-end">
              {/* (Date) */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              {/* (Time) */}
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
        {/* Activity */}
        <a
          className="flex items-center"
          href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
          target="_blank">
          {/* Frame 12 */}
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            {/* Frame 9 txLog.status === TransactionStatus.Failed */}
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* 24-up right */}
              <Close5 className="w-[16px] h-[16px] m-[0px_8px_0px_0px]" />
              {/* Send */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
                Failed
              </div>
              {/* 1.2 */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
                1.2
              </div>
              {/* ETH */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                ETH
              </div>
            </div>
            {/* to: */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
              to: 0x0000...00000
            </div>
          </div>
          {/* Frame 16 */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            {/* Frame 13 */}
            <div className="flex flex-col items-end">
              {/* (Date) */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              {/* (Time) */}
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
        {/* Activity */}
        <div className="flex items-center">
          {/* Frame 12 */}
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            {/* Frame 9 */}
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* 24-up right */}
              <Close5 className="w-[16px] h-[16px] m-[0px_8px_0px_0px]" />
              {/* Send */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
                {status}
              </div>
            </div>
          </div>
          {/* Frame 16 */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            {/* Frame 13 */}
            <div className="flex flex-col items-end">
              {/* (Date) */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              {/* (Time) */}
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
        {/* Activity */}
        <div className="flex items-center">
          {/* Frame 12 */}
          <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
            {/* Frame 9 */}
            <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
              {/* 24-up right */}
              <Time className="w-[16px] h-[16px] m-[0px_8px_0px_0px]" />
              {/* Send */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
                {status}
              </div>
              {/* 1.2 */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
                1.2
              </div>
              {/* ETH */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                ETH
              </div>
            </div>
            {/* to: */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
              to: 0x0000...00000
            </div>
          </div>
          {/* Frame 16 */}
          <div className="w-[81px] m-[14px_16px_14px_0px]">
            {/* Frame 13 */}
            <div className="flex flex-col items-end">
              {/* (Date) */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationDate}
              </div>
              {/* (Time) */}
              <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
                {creationTime}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Others' case
  return (
    <>
      {/* Activity */}
      <div className="flex items-center">
        {/* Frame 12 */}
        <div className="flex flex-col items-start m-[14px_141px_14px_16px]">
          {/* Frame 9 */}
          <div className="w-[132px] flex items-center m-[0px_4px_4px_0px]">
            {/* 24-up right */}
            <SystemHelp className="w-[16px] h-[16px] m-[0px_8px_0px_0px]" />
            {/* Send */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
              {status}
            </div>
            {/* 1.2 */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_8px_0px_0px]">
              1.2
            </div>
            {/* ETH */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
              ETH
            </div>
          </div>
          {/* to: */}
          <div className="font-[Inter] font-[400] text-[16px] text-[#bbbbbb] whitespace-nowrap">
            to: 0x0000...00000
          </div>
        </div>
        {/* Frame 16 */}
        <div className="w-[81px] m-[14px_16px_14px_0px]">
          {/* Frame 13 */}
          <div className="flex flex-col items-end">
            {/* (Date) */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
              {creationDate}
            </div>
            {/* (Time) */}
            <div className="font-[Inter] font-[400] text-[16px] text-[#000000]">
              {creationTime}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
