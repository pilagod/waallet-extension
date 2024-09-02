import { useEffect, useState } from "react"
import ChevronDown from "react:~assets/chevronDown.svg"
import { useHashLocation } from "wouter/use-hash-location"

import { useAccount, useNetwork } from "~app/hook/storage"
import { Path } from "~app/path"

export function Navbar() {
  return (
    <>
      {/* Home page navbar */}
      <nav className="flex items-center justify-between mb-[16px] mt-[4px]">
        <AccountSelector />
        <NetworkSelector />
      </nav>
    </>
  )
}

export function NetworkSelector() {
  const [, navigate] = useHashLocation()
  const network = useNetwork()
  return (
    <div>
      <button
        className="flex items-center gap-[12px] px-[20px] py-[12px] rounded-full border-[1px] border-solid border-black"
        onClick={() => navigate(Path.NetworkList)}>
        <div className="w-[24px]">
          <img src={network.icon} alt={network.name} />
        </div>
        <div className="w-[16px]">
          <ChevronDown />
        </div>
      </button>
    </div>
  )
}

function AccountSelector() {
  const [, navigate] = useHashLocation()
  let account = null
  try {
    account = useAccount()
  } catch (error) {
    console.warn(`Error in AccountSelector: ${error}`)
    account = null
  }

  return (
    <div>
      {/* Home page account selector button */}
      <button
        className="p-[7px_20px_7px_20px] flex items-center rounded-full border-[1px] border-solid border-black"
        onClick={() =>
          account ? navigate(Path.AccountList) : navigate(Path.AccountCreate)
        }>
        <div className="mr-[12px] flex flex-col items-start">
          <div className="leading-[19.4px] text-[16px] text-[#000000] whitespace-nowrap">
            {account ? account.name : "No account"}
          </div>
          <div className="leading-[14.6px] text-[12px] text-[#989898]">
            {account ? account.address.ellipsize() : "Create new account"}
          </div>
        </div>
        <ChevronDown className="w-[16px] h-[16px]" />
      </button>
    </div>
  )
}
