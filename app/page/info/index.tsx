import * as ethers from "ethers"
import { useEffect, useState } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~app/context/provider"
import { NavbarLayout } from "~app/layout/navbar"
import { Activity } from "~app/page/info/activity"
import { Tokens } from "~app/page/info/tokens"
import { Path } from "~app/path"
import {
  useAccount,
  useAction,
  useNetwork,
  useShouldOnboard
} from "~app/storage"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import number from "~packages/util/number"

export enum InfoNavigation {
  Activity = "Activity",
  Tokens = "Tokens"
}

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
    if (!network.accountFactory[AccountType.PasskeyAccount]) {
      throw new Error("Passkey account factory is not set")
    }
    const account = await PasskeyAccount.initWithFactory(provider, {
      owner: await PasskeyOwnerWebAuthn.register(),
      salt: number.random(),
      factoryAddress: network.accountFactory[AccountType.PasskeyAccount].address
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

export function AccountInfo() {
  const explorerUrl = "https://jiffyscan.xyz/"

  const { provider } = useProviderContext()
  const account = useAccount()
  const [balance, setBalance] = useState<bigint>(0n)
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true)
  const [infoNavigation, setInfoNavigation] = useState<InfoNavigation>(
    InfoNavigation.Activity
  )

  useEffect(() => {
    // TODO: In the future, adding an Indexer to the Background Script to
    // monitor Account-related transactions. Updates like balance will trigger
    // as needed, avoiding fixed interval polling with setInterval().
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

  const handleInfoNaviChange = (page: InfoNavigation) => {
    setInfoNavigation(page)
  }

  return (
    <div>
      {/* Display the Account address */}
      {account.address && (
        <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
          <a
            href={`${explorerUrl}account/${
              account.address
            }?network=${getChainName(account.chainId)}`}
            target="_blank">
            {`${account.address}`}
          </a>
        </div>
      )}

      {/* Display the Account balance */}
      <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        Balance: {balanceLoading ? "(Loading...)" : ethers.formatEther(balance)}
      </div>

      {/* Show the send button for switching to the Send page */}
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        <Link href={Path.Send}>Send ↗</Link>
      </div>

      {/* Display the navigation bar of the Info page */}
      <div>
        <nav className="w-full grid grid-cols-5 justify-items-center my-4 text-base">
          <button
            className="col-span-1 cursor-pointer"
            onClick={() => handleInfoNaviChange(InfoNavigation.Activity)}>
            {InfoNavigation.Activity}
          </button>
          <button
            className="col-span-3 cursor-pointer"
            onClick={() => handleInfoNaviChange(InfoNavigation.Tokens)}>
            {InfoNavigation.Tokens}
          </button>
        </nav>
        <div>
          {infoNavigation === InfoNavigation.Activity && <Activity />}
          {infoNavigation === InfoNavigation.Tokens && <Tokens />}
        </div>
      </div>
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
