import { useState } from "react"
import Down from "react:~assets/down.svg"
import Rectangle1 from "react:~assets/rectangle1.svg"
import Rectangle3 from "react:~assets/rectangle3.svg"
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
      <div className="w-[390px] m-[20px_0px_24px_0px]">
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
    InfoNavigation.Tokens
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
        <div className="font-[Inter] font-[400] text-[48px] text-[#000000] whitespace-nowrap leading-[58.09px]">{`$ ${number.formatUnitsToFixed(
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

      <Rectangle1 className="w-[390px] h-[1px]" />
      {/* Token and Activity list */}
      <div>
        {/* tab */}
        <nav className="flex items-start">
          {/* Frame 11 */}
          <div className="flex flex-col items-center m-[0px_24px_8px_16px]">
            {/* Token */}
            <button
              className={`font-[Inter] font-[400] text-[16px] ${
                infoNavigation !== InfoNavigation.Tokens && "text-[#bbbbbb]"
              }`}
              onClick={() => handleInfoNaviChange(InfoNavigation.Tokens)}>
              {InfoNavigation.Tokens}
            </button>
            {/* Rectangle 3 */}
            {infoNavigation === InfoNavigation.Tokens && (
              <Rectangle3 className="w-[20px] h-[2px]" />
            )}
          </div>

          {/* Activity */}
          <div className="flex flex-col items-center m-[0px_16px_14px_0px]">
            <button
              className={`font-[Inter] font-[400] text-[16px] ${
                infoNavigation !== InfoNavigation.Activity && "text-[#bbbbbb]"
              }`}
              onClick={() => handleInfoNaviChange(InfoNavigation.Activity)}>
              {InfoNavigation.Activity}
            </button>
            {infoNavigation === InfoNavigation.Activity && (
              <Rectangle3 className="w-[20px] h-[2px]" />
            )}
          </div>
        </nav>
        {infoNavigation === InfoNavigation.Tokens && <Tokens />}
        {infoNavigation === InfoNavigation.Activity && <Activity />}
      </div>
    </>
  )
}
