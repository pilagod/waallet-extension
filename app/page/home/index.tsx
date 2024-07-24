import { useContext, useState } from "react"
import ArrowDown from "react:~assets/arrowDown.svg"
import ArrowUp from "react:~assets/arrowUp.svg"
import { Link } from "wouter"

import { Divider } from "~app/component/divider"
import { ProviderContext } from "~app/context/provider"
import { ToastContext } from "~app/context/toastContext"
import {
  useAccount,
  useAccounts,
  useAction,
  useNetwork
} from "~app/hook/storage"
import { Activity } from "~app/page/home/activity"
import { Navbar } from "~app/page/home/navbar"
import { Token } from "~app/page/home/token"
import { Path } from "~app/path"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import number from "~packages/util/number"

export enum InfoNavigation {
  Activity = "Activity",
  Token = "Token"
}

export function Home() {
  const hasNoAccount = useAccounts().length === 0
  return (
    <>
      <Navbar />
      {hasNoAccount ? (
        <AccountCreation />
      ) : (
        <>
          <AccountInfo />
          <Divider />
          <AccountNavigation />
        </>
      )}
    </>
  )
}

function AccountCreation() {
  const { provider } = useContext(ProviderContext)
  const { setToast } = useContext(ToastContext)
  const { createAccount } = useAction()

  const network = useNetwork()

  const createNewAccount = async () => {
    try {
      if (!network.accountFactory[AccountType.PasskeyAccount]) {
        throw new Error("Passkey account factory is not set")
      }
      const account = await PasskeyAccount.initWithFactory(provider, {
        owner: await PasskeyOwnerWebAuthn.register(),
        salt: number.random(),
        factoryAddress: network.accountFactory[AccountType.PasskeyAccount]
      })
      await createAccount("Account 1", account, network.id)
      setToast("Account created!", "success")
    } catch (error) {
      setToast(error.message, "failed")
    }
  }

  return (
    <div className="text-center">
      <button
        className="border-2 border-black rounded-full px-2"
        onClick={createNewAccount}>
        Create your first AA account
      </button>
    </div>
  )
}

export function AccountInfo() {
  const account = useAccount()

  return (
    <div className="w-full pb-[24px]">
      {/* Home page blance status */}
      <div className="flex flex-col items-start mb-[16px]">
        {/* Home page Blance */}
        <div className="mb-[8px] leading-[19px] text-[16px] text-[#000000]">
          Balance
        </div>
        <div className="leading-[58px] text-[48px] text-[#000000] whitespace-nowrap">{`$ ${number.formatUnitsToFixed(
          account.balance,
          18,
          2
        )}`}</div>
      </div>
      {/* Home page action */}
      <div className="flex justify-between">
        {/* Home page send button */}
        <Link
          className="flex items-center p-[16px_49px_16px_49px] rounded-full border-[1px] border-solid border-black"
          href={Path.Send}>
          <ArrowUp className="w-[24px] h-[24px] mr-[10px]" />
          <div className="leading-[19.36px] text-[16px] text-[#000000]">
            Send
          </div>
        </Link>
        {/* Home page receive button */}
        <Link
          className="flex items-center px-[38.5px] py-[16px] rounded-full border-[1px] border-solid border-black"
          href={Path.Receive}>
          <ArrowDown className="w-[24px] h-[24px] mr-[10px]" />
          <div className="leading-[19.36px] text-[16px] text-[#000000]">
            Receive
          </div>
        </Link>
      </div>
    </div>
  )
}

export function AccountNavigation() {
  const [infoNavigation, setInfoNavigation] = useState<InfoNavigation>(
    InfoNavigation.Token
  )

  const handleInfoNaviChange = (page: InfoNavigation) => {
    setInfoNavigation(page)
  }
  return (
    <div className="w-full pt-[24px]">
      {/* Home page token or activity bar and list */}
      <div className="flex items-start pb-[8px]">
        <div className="flex flex-col items-center mr-[24px]">
          {/* Home page token bar */}
          <button
            className={`mb-[4px] leading-[19px] text-[16px] ${
              infoNavigation !== InfoNavigation.Token && "text-[#bbbbbb]"
            }`}
            onClick={() => handleInfoNaviChange(InfoNavigation.Token)}>
            {InfoNavigation.Token}
          </button>
          {infoNavigation === InfoNavigation.Token && (
            <div className="p-[0px_10px_0px_10px] border-[1px] border-solid border-black" />
          )}
        </div>

        {/* Home page activity bar */}
        <div className="flex flex-col items-center">
          <button
            className={`mb-[4px] leading-[19px] text-[16px] ${
              infoNavigation !== InfoNavigation.Activity && "text-[#bbbbbb]"
            }`}
            onClick={() => handleInfoNaviChange(InfoNavigation.Activity)}>
            {InfoNavigation.Activity}
          </button>
          {infoNavigation === InfoNavigation.Activity && (
            <div className="p-[0px_10px_0px_10px] border-[1px] border-solid border-black" />
          )}
        </div>
      </div>
      {/* Home page token list */}
      {infoNavigation === InfoNavigation.Token && <Token />}
      {/* Home page activity list */}
      {infoNavigation === InfoNavigation.Activity && <Activity />}
    </div>
  )
}
