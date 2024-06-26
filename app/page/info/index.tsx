import { useState } from "react"
import Down from "react:~assets/down.svg"
import Up from "react:~assets/up.svg"
import { Link } from "wouter"

import { Navbar } from "~app/component/navbar"
import { useProviderContext } from "~app/context/provider"
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
import { getChainName } from "~packages/network/util"
import number from "~packages/util/number"

export enum InfoNavigation {
  Activity = "Activity",
  Tokens = "Tokens"
}

export function Info() {
  const shouldOnboard = useShouldOnboard()
  return (
    <>
      {/* Frame 6 */}
      <div className="m-[20px_0px_24px_0px]">
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
    InfoNavigation.Activity
  )

  const handleInfoNaviChange = (page: InfoNavigation) => {
    setInfoNavigation(page)
  }

  return (
    <>
      {/* Blance */}
      <div className="flex flex-col items-start m-[0px_16px_16px_16px]">
        {/* Blance */}
        <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[0px_0px_8px_0px]">
          Balance
        </div>
        {/* (amount) */}
        <div className="font-[Inter] font-[400] text-[48px] text-[#000000] whitespace-nowrap">{`$ ${number.formatUnitsToFixed(
          account.balance,
          18,
          2
        )}`}</div>
      </div>
      {/* action */}
      <div className="flex justify-evenly m-[0px_0px_24px_0px]">
        {/* Send */}
        <div className="w-[171px] flex items-center rounded-[99px] border-[1px] border-solid border-black">
          <Up className="w-[24px] h-[24px] m-[16px_2.5px_16px_49px]" />
          <Link
            className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[18.5px_49px_18.5px_0px]"
            href={Path.Send}>
            Send
          </Link>
        </div>
        {/* Receive */}
        <div className="w-[171px] flex items-center rounded-[99px] border-[1px] border-solid border-black">
          <Down className="w-[24px] h-[24px] m-[16px_2.5px_16px_38.5px]" />
          <div className="font-[Inter] font-[400] text-[16px] text-[#000000] m-[18.5px_38.5px_18.5px_0px]">
            Receive
          </div>
        </div>
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
    </>
  )
}
