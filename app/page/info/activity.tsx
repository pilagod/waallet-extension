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
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      Transaction History:
      {txLogs.length === 0 ? (
        <div>(No transactions)</div>
      ) : (
        // TODO: Render based on transaction log type
        txLogs.map((txLog, i) => (
          <UserOpHistoryItem key={i} txLog={txLog} chainName={chainName} />
        ))
      )}
    </div>
  )
}

const UserOpHistoryItem: React.FC<{
  txLog: TransactionLog
  chainName: string
}> = ({ txLog, chainName }) => {
  const { createdAt, status } = txLog
  const creationDate = new Date(createdAt * 1000).toLocaleDateString()

  if (
    txLog.status === TransactionStatus.Succeeded ||
    txLog.status === TransactionStatus.Failed
  ) {
    const userOpHash = txLog.receipt.userOpHash
    return (
      <div>
        <span>{`${creationDate}: `}</span>
        <span>{`${status} `}</span>
        <a
          href={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}
          target="_blank">
          {`${address.ellipsize(userOpHash)}`}
        </a>
      </div>
    )
  }

  return (
    <div>
      <span>{`${creationDate}: `}</span>
      <span>{`${status}`}</span>
    </div>
  )
}
