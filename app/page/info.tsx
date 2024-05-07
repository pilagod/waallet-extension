import * as ethers from "ethers"
import { useEffect, useState, type MouseEvent } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~app/context/provider"
import { NavbarLayout } from "~app/layout/navbar"
import { Path } from "~app/path"
import { useAccount, useUserOperationLogs } from "~app/storage"
import { type Account, type UserOperationLog } from "~background/storage/local"
import { UserOperation } from "~packages/bundler"
import address from "~packages/util/address"

export function Info() {
  const explorerUrl = "https://jiffyscan.xyz/"

  const { provider } = useProviderContext()
  const userOpLogs = useUserOperationLogs()
  const account = useAccount()
  const [balance, setBalance] = useState<bigint>(0n)
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false)

  useEffect(() => {
    setBalanceLoading(true)
    // Periodically check the balance of the account
    const asyncIntervalFn = async () => {
      const balance = await provider.getBalance(account.address)
      setBalanceLoading(false)
      setBalance(balance)
    }
    const id = setInterval(() => {
      asyncIntervalFn().catch((e) => console.log(e))
    }, 3333) // Every 3.333 seconds

    return () => {
      clearInterval(id)
    }
  }, [])

  return (
    <NavbarLayout>
      {account.address && (
        <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
          <button
            onClick={handleClick}
            data-url={`${explorerUrl}account/${
              account.address
            }?network=${getChainName(account.chainId)}`}>
            {`${account.address}`}
          </button>
        </div>
      )}
      {
        <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
          Balance:{" "}
          {balanceLoading ? "(Loading...)" : ethers.formatEther(balance)}
        </div>
      }
      <SwitchToSendPage />
      {
        <UserOpsData
          userOpsLogs={userOpLogs}
          account={account}
          explorerUrl={explorerUrl}
        />
      }
    </NavbarLayout>
  )
}

const SwitchToSendPage: React.FC = () => {
  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <Link href={Path.Send}>Send ↗</Link>
    </div>
  )
}

const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
  const url = event.currentTarget.getAttribute("data-url")

  if (url) {
    chrome.tabs.create({ url })
  }
}

const UserOpsData: React.FC<{
  userOpsLogs: UserOperationLog[]
  account: Account
  explorerUrl: string
}> = ({ userOpsLogs, account, explorerUrl }) => {
  // Filter UserOperationLog objects based on a specific sender address
  // and transforms them into status and hash objects.
  const userOpsUi = userOpsLogs
    .filter((userOpLog) => {
      const userOp = new UserOperation(userOpLog.userOp)
      return userOp.sender.toLowerCase() === account.address.toLowerCase()
    })
    .map((userOpLog) => {
      const userOp = new UserOperation(userOpLog.userOp)
      return {
        status: userOpLog.status,
        hash: userOp.hash(userOpLog.entryPointAddress, account.chainId)
      }
    })
  const chainName = getChainName(account.chainId)
  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      User Operation History:
      {userOpsUi.length === 0 ? (
        <div>(No user operations)</div>
      ) : (
        userOpsUi.map((userOp, i, _) => (
          <div key={i}>
            <span>{`${userOp.status}: `}</span>
            <button
              onClick={handleClick}
              data-url={`${explorerUrl}userOpHash/${userOp.hash}?network=${chainName}`}>
              {`${address.ellipsize(userOp.hash)}`}
            </button>
          </div>
        ))
      )}
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
