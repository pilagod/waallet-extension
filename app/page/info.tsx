import * as ethers from "ethers"
import { useEffect, useState, type MouseEvent } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~app/context/provider"
import { NavbarLayout } from "~app/layout/navbar"
import { Path } from "~app/path"
import {
  useAccount,
  useAction,
  useNetwork,
  useShouldOnboard,
  useUserOperationLogs
} from "~app/storage"
import {
  UserOperationStatus,
  type Account,
  type UserOperationLog
} from "~background/storage/local"
import { config } from "~config"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { UserOperation } from "~packages/bundler"
import address from "~packages/util/address"
import number from "~packages/util/number"

export function Info() {
  const shouldOnboard = useShouldOnboard()
  return (
    <NavbarLayout>
      {shouldOnboard ? <AccountCreation /> : <AccountInfo />}
    </NavbarLayout>
  )
}

function AccountCreation() {
  const { provider } = useProviderContext()
  const { createAccount } = useAction()
  const network = useNetwork()

  const onPasskeyAccountCreated = async () => {
    if (!config.passkeyAccountFactory) {
      throw new Error("Passkey account factory is not set")
    }
    const account = await PasskeyAccount.initWithFactory(provider, {
      owner: await PasskeyOwnerWebAuthn.register(),
      salt: number.random(),
      factoryAddress: config.passkeyAccountFactory
    })
    await createAccount(account, network.id)
  }

  return (
    <div className="text-center">
      <button
        className="border-2 border-black rounded-full px-2"
        onClick={onPasskeyAccountCreated}>
        Create your first AA account
      </button>
    </div>
  )
}

function AccountInfo() {
  const explorerUrl = "https://jiffyscan.xyz/"

  const { provider } = useProviderContext()
  const userOpLogs = useUserOperationLogs()
  const account = useAccount()
  const [balance, setBalance] = useState<bigint>(0n)
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true)

  useEffect(() => {
    const getBalanceAsync = async () => {
      const balance = await provider.getBalance(account.address)
      setBalanceLoading(false)
      setBalance(balance)
    }
    // Fetch initial balance
    getBalanceAsync()

    // Periodically check the balance of the account
    const id = setInterval(() => {
      getBalanceAsync().catch((e) =>
        console.warn(`An error occurred while receiving balance: ${e}`)
      )
    }, 3333) // Every 3.333 seconds

    return () => {
      clearInterval(id)
    }
  }, [account.id])

  return (
    <div>
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
      <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        Balance: {balanceLoading ? "(Loading...)" : ethers.formatEther(balance)}
      </div>
      <SwitchToSendPage />
      <UserOpHistory
        userOpLogs={userOpLogs}
        account={account}
        explorerUrl={explorerUrl}
      />
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
        <button
          onClick={handleClick}
          data-url={`${explorerUrl}userOpHash/${userOpHash}?network=${chainName}`}>
          {`${address.ellipsize(userOpHash)}`}
        </button>
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
