import * as ethers from "ethers"
import { useEffect, useState, type MouseEvent } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~app/context/provider"
import { NavbarLayout } from "~app/layout/navbar"
import { Path } from "~app/path"
import { useAccount, useUserOperationLogs } from "~app/storage"
import {
  UserOperationStatus,
  type UserOperationLog
} from "~background/storage/local"
import { UserOperation } from "~packages/bundler"
import address from "~packages/util/address"
import type { HexString } from "~typing"

type UserOperationUi = {
  status: UserOperationStatus
  hash: HexString
}

export function Info() {
  const explorerUrl = "https://jiffyscan.xyz/"

  const { provider } = useProviderContext()
  const userOpLogs = useUserOperationLogs()
  const account = useAccount()
  const [chainName, setChainName] = useState<string>("")
  const [balance, setBalance] = useState<bigint>(0n)
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false)
  const [userOpsUi, setUserOpsUi] = useState<UserOperationUi[]>([])

  useEffect(() => {
    // Retrieve chainName when the Info page is opened
    const asyncFn = async () => {
      const chain = getChainName((await provider.getNetwork()).name)
      setChainName(chain)
    }

    asyncFn()
  }, [])

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

  useEffect(() => {
    // Update userOpsUiData when userOpLogs change
    const userOpsUiData = getUserOpsUiData(
      userOpLogs,
      account.chainId,
      account.address
    )
    setUserOpsUi(userOpsUiData)
  }, [userOpLogs, account])

  return (
    <NavbarLayout>
      {account.address && (
        <AccountAddress
          account={account.address}
          explorerUrl={explorerUrl}
          chainName={chainName}
        />
      )}
      {<AccountBalance balanceLoading={balanceLoading} balance={balance} />}
      <SwitchToSendPage />
      {
        <UserOpsData
          userOpsUi={userOpsUi}
          explorerUrl={explorerUrl}
          chainName={chainName}
        />
      }
    </NavbarLayout>
  )
}

const AccountAddress: React.FC<{
  account: HexString
  explorerUrl: string
  chainName: string
}> = ({ account, explorerUrl, chainName }) => {
  return (
    <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <button
        onClick={handleClick}
        data-url={`${explorerUrl}account/${account}?network=${chainName}`}>
        {`${account}`}
      </button>
    </div>
  )
}

const AccountBalance: React.FC<{
  balanceLoading: boolean
  balance: bigint
}> = ({ balanceLoading, balance }) => {
  return (
    <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      Balance: {balanceLoading ? "(Loading...)" : ethers.formatEther(balance)}
    </div>
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

// getUserOpsUiData() filters UserOperationLog objects based on a specific
// sender address and transforms them into UserOperationUi objects
// containing status and hash properties.
const getUserOpsUiData = (
  userOpLogs: UserOperationLog[],
  chainId: number,
  accountAddress: string
): UserOperationUi[] => {
  return userOpLogs
    .filter((userOpLog) => {
      const userOp = new UserOperation(userOpLog.userOp)
      return userOp.sender.toLowerCase() === accountAddress.toLowerCase()
    })
    .map((userOpLog) => {
      const userOp = new UserOperation(userOpLog.userOp)
      return {
        status: userOpLog.status,
        hash: userOp.hash(userOpLog.entryPointAddress, chainId)
      }
    })
}

const UserOpsData: React.FC<{
  userOpsUi: UserOperationUi[]
  explorerUrl: string
  chainName: string
}> = ({ userOpsUi: userOpsData, explorerUrl, chainName }) => {
  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      User Operation History:
      {userOpsData.length === 0 ? (
        <div>(No user operations)</div>
      ) : (
        userOpsData.map((userOp, i, _) => (
          // The key prevent the "Each child in a list should have a unique 'key' prop" warning.
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
    case "goerli":
    case 5:
      chainName = "goerli"
      break
    case "optimism":
    case 10:
      chainName = "optimism"
      break
    case "bsc":
    case 56:
      chainName = "bsc"
      break
    case "matic":
    case 137:
      chainName = "matic"
      break
    case "arbitrum-one":
    case 42161:
      chainName = "arbitrum-one"
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
