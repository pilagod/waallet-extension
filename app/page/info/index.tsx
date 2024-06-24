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
    <div className="w-[Fill_(390px)_px] h-[Hug_(221px)_px] p-[0px_16px_0px_16px] gap-[16px] opacity-[0px]">
      <Navbar />
      {shouldOnboard ? <AccountCreation /> : <AccountInfo />}
    </div>
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
      {/* Display the Account balance */}
      <div className="w-[Fill_(358px)] h-[Hug_(85px)] gap-[8px]">
        <div className="w-[51px] h-[19px] font-[Inter] font-[400] text-[16px] leading-[19.36px] text-[#000000]">
          Balance
        </div>
        <div className="w-[248px] h-[58px] font-[Inter] font-[400] text-[48px] leading-[58.09px] text-[#000000]">{`$${number.formatUnitsToFixed(
          account.balance,
          18
        )}`}</div>
      </div>

      <div className="flex w-[Fill_(358px)] h-[Hug_(56px)] gap-[16px]">
        {/* Show the send button for switching to the Send page */}
        <div className="flex w-[Fill_(171px)] h-[Hug_(56px)] rounded-[99px] border-[1px] p-[16px] gap-[10px] bg-[#ffffff] border-[1px_solid_#000000] duration-[0ms]">
          <Up className="w-[24px] h-[24px]" />
          <Link
            className="w-[39px] h-[19px] font-[Inter] font-[400] text-[16px] leading-[19.36px] text-[#000000]"
            href={Path.Send}>
            Send
          </Link>
        </div>
        {/* Show the receive button for switching to the QR code page */}
        <div className="flex w-[Fill_(171px)] h-[Fixed_(56px)] rounded-[99px] border-[1px] p-[16px] gap-[10px] bg-[#ffffff] border-[1px_solid_#000000]">
          <Down className="w-[24px] h-[24px]" />
          <div className="w-[39px] h-[19px] font-[Inter] font-[400] text-[16px] leading-[19.36px] text-[#000000]">
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
