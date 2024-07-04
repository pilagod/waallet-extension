import { useState } from "react"
import ArrowDown from "react:~assets/arrowDown.svg"
import ArrowUp from "react:~assets/arrowUp.svg"
import { Link } from "wouter"

import { Navbar } from "~app/component/navbar"
import { useProviderContext } from "~app/context/provider"
import { Activity } from "~app/page/info/activity"
import { Token } from "~app/page/info/token"
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
import { getChainName } from "~packages/network/util"
import number from "~packages/util/number"

export enum InfoNavigation {
  Activity = "Activity",
  Token = "Token"
}

export function Home() {
  const shouldOnboard = useShouldOnboard()
  return (
    <>
      {/* Home page */}
      <div className="w-full p-[24px_16px_0px_16px]">
        <Navbar />
      </div>
      {shouldOnboard ? (
        <AccountCreation />
      ) : (
        <>
          {/* Account info */}
          <AccountInfo />
          {/* Divider */}
          <div className="w-full border-[0.5px] border-solid border-black" />
          {/* Account navigation */}
          <AccountNavigation />
        </>
      )}
    </>
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
      factoryAddress: network.accountFactory[AccountType.PasskeyAccount]
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
  const account = useAccount()

  return (
    <div className="w-full p-[0px_16px_0px_16px] mb-[24px]">
      {/* Home page blance status */}
      <div className="flex flex-col items-start m-[0px_16px_16px_16px]">
        {/* Home page Blance */}
        <div className="mb-[8px] leading-[19.36px] text-[16px] font-[Inter] font-[400] text-[#000000]">
          Balance
        </div>
        <div className="leading-[58.09px] text-[48px] font-[Inter] font-[400] text-[#000000] whitespace-nowrap">{`$ ${number.formatUnitsToFixed(
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
          <div className="leading-[19.36px] text-[16px] font-[Inter] font-[400] text-[#000000]">
            Send
          </div>
        </Link>
        {/* Home page receive button */}
        <button className="flex items-center p-[16px_38.5px_16px_38.5px] rounded-full border-[1px] border-solid border-black">
          <ArrowDown className="w-[24px] h-[24px] mr-[10px]" />
          <div className="leading-[19.36px] text-[16px] font-[Inter] font-[400] text-[#000000]">
            Receive
          </div>
        </button>
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
    <div className="w-full p-[0px_16px_24px_16px] mt-[24px]">
      {/* Home page token or activity bar and list */}
      <div className="flex items-start pb-[8px]">
        <div className="flex flex-col items-center mr-[24px]">
          {/* Home page token bar */}
          <button
            className={`mb-[4px] leading-[19px] text-[16px] font-[Inter] font-[400] ${
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
            className={`mb-[4px] leading-[19px] text-[16px] font-[Inter] font-[400] ${
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
