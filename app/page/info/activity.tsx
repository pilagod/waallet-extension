import { useAccount, useUserOperationLogs } from "~app/storage"
import { UserOperation } from "~packages/bundler"
import address from "~packages/util/address"
import {
  UserOperationStatus,
  type Account,
  type UserOperationLog
} from "~storage/local"

export function Activity() {
  const explorerUrl = "https://jiffyscan.xyz/"
  const userOpLogs = useUserOperationLogs()
  const account = useAccount()

  return (
    <div>
      <UserOpHistory
        userOpLogs={userOpLogs}
        account={account}
        explorerUrl={explorerUrl}
      />
    </div>
  )
}

const UserOpHistory: React.FC<{
  userOpLogs: UserOperationLog[]
  account: Account
  explorerUrl: string
}> = ({ userOpLogs, account, explorerUrl }) => {
  // Filter UserOperationLog objects based on a specific sender address.
  const userOpHistoryItems = userOpLogs.filter((userOpLog) => {
    const userOp = new UserOperation(userOpLog.userOp)
    return userOp.isSender(account.address)
  })
  const chainName = getChainName(account.chainId)

  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      User Operation History:
      {userOpHistoryItems.length === 0 ? (
        <div>(No user operations)</div>
      ) : (
        userOpHistoryItems.map((userOpLog, i, _) => (
          <UserOpHistoryItem
            key={i}
            userOpLog={userOpLog}
            chainName={chainName}
            explorerUrl={explorerUrl}
          />
        ))
      )}
    </div>
  )
}

const UserOpHistoryItem: React.FC<{
  userOpLog: UserOperationLog
  chainName: string
  explorerUrl: string
}> = ({ userOpLog, chainName, explorerUrl }) => {
  const { createdAt, status } = userOpLog
  const creationDate = new Date(createdAt * 1000).toLocaleDateString()

  if (
    userOpLog.status === UserOperationStatus.Succeeded ||
    userOpLog.status === UserOperationStatus.Failed
  ) {
    const userOpHash = userOpLog.receipt.userOpHash
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

const getChainName = (chain: string | number): string => {
  const net = typeof chain === "string" ? chain.toLowerCase() : chain
  let chainName: string
  switch (net) {
    case "mainnet":
    case 1:
      chainName = "mainnet"
      break
    case "testnet":
    case 1337:
      chainName = "testnet"
      break
    case "sepolia":
    case 11155111:
      chainName = "sepolia"
      break
    default:
      chainName = null
  }
  return chainName
}
