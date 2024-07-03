import { useState } from "react"
import ArrowDown from "react:~assets/arrowDown.svg"
import ArrowUp from "react:~assets/arrowUp.svg"
import HorizontalRule from "react:~assets/horizontalRule.svg"
import Underline from "react:~assets/underline.svg"
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
      <div className="w-[390px] mb-[24px] p-[24px_16px_24px_16px]">
        <Navbar />
        {shouldOnboard ? <AccountCreation /> : <AccountInfo />}
      </div>
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
  const explorerUrl = "https://jiffyscan.xyz/"

  const account = useAccount()

  const [infoNavigation, setInfoNavigation] = useState<InfoNavigation>(
    InfoNavigation.Token
  )

  const handleInfoNaviChange = (page: InfoNavigation) => {
    setInfoNavigation(page)
  }

  return (
    <>
      {/* Home page blance status */}
      <div className="flex flex-col items-start m-[0px_16px_16px_16px]">
        {/* Home page Blance */}
        <div className="font-[Inter] font-[400] text-[16px] text-[#000000] mb-[8px]">
          Balance
        </div>
        <div className="leading-[58.09px] text-[48px] font-[Inter] font-[400] text-[#000000] whitespace-nowrap">{`$ ${number.formatUnitsToFixed(
          account.balance,
          18,
          2
        )}`}</div>
      </div>
      {/* Home page action */}
      <div className="flex justify-evenly mb-[24px]">
        {/* Home page send button */}
        <Link
          className="w-[171px] flex items-center rounded-full border-[1px] border-solid border-black"
          href={Path.Send}>
          <ArrowUp className="w-[24px] h-[24px] m-[16px_2.5px_16px_49px]" />
          <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[18.5px_49px_18.5px_0px]">
            Send
          </div>
        </Link>
        {/* Home page receive button */}
        <button className="w-[171px] flex items-center rounded-full border-[1px] border-solid border-black">
          <ArrowDown className="w-[24px] h-[24px] m-[16px_2.5px_16px_38.5px]" />
          <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[18.5px_38.5px_18.5px_0px]">
            Receive
          </div>
        </button>
      </div>

      <HorizontalRule className="w-[390px] h-[1px]" />
      {/* Home page token or activity bar and list */}
      <div>
        <nav className="flex items-start">
          <div className="flex flex-col items-center m-[0px_24px_8px_16px]">
            {/* Home page token bar */}
            <button
              className={`font-[Inter] font-[400] text-[16px] ${
                infoNavigation !== InfoNavigation.Token && "text-[#bbbbbb]"
              }`}
              onClick={() => handleInfoNaviChange(InfoNavigation.Token)}>
              {InfoNavigation.Token}
            </button>
            {infoNavigation === InfoNavigation.Token && (
              <Underline className="w-[20px] h-[2px]" />
            )}
          </div>

          {/* Home page activity bar */}
          <div className="flex flex-col items-center m-[0px_16px_14px_0px]">
            <button
              className={`font-[Inter] font-[400] text-[16px] ${
                infoNavigation !== InfoNavigation.Activity && "text-[#bbbbbb]"
              }`}
              onClick={() => handleInfoNaviChange(InfoNavigation.Activity)}>
              {InfoNavigation.Activity}
            </button>
            {infoNavigation === InfoNavigation.Activity && (
              <Underline className="w-[20px] h-[2px]" />
            )}
          </div>
        </nav>
        {/* Home page token list */}
        {infoNavigation === InfoNavigation.Token && <Token />}
        {/* Home page activity list */}
        {infoNavigation === InfoNavigation.Activity && <Activity />}
      </div>
    </>
  )
}
