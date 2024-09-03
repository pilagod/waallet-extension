import ChevronDown from "react:~assets/chevronDown.svg"
import { useHashLocation } from "wouter/use-hash-location"

import { useAccount, useHasNoAccount, useNetwork } from "~app/hook/storage"
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
  const hasNoAccount = useHasNoAccount()

  if (hasNoAccount) {
    return (
      <AccountSelectorButton
        accountName="No account"
        accountAddress="Create new account"
        onClick={() => navigate(Path.AccountCreate)}
      />
    )
  }

  return <AccountSelectorWithAccount />
}

function AccountSelectorWithAccount() {
  const [, navigate] = useHashLocation()
  const account = useAccount()

  return (
    <AccountSelectorButton
      accountName={account.name}
      accountAddress={account.address.ellipsize()}
      onClick={() => navigate(Path.AccountList)}
    />
  )
}

function AccountSelectorButton({
  accountName,
  accountAddress,
  onClick
}: {
  accountName: string
  accountAddress: string
  onClick: () => void
}) {
  return (
    <div>
      {/* Home page account selector button */}
      <button
        className="p-[7px_20px_7px_20px] flex items-center rounded-full border-[1px] border-solid border-black"
        onClick={onClick}>
        <div className="mr-[12px] flex flex-col items-start">
          <div className="leading-[19.4px] text-[16px] text-[#000000] whitespace-nowrap">
            {accountName}
          </div>
          <div className="leading-[14.6px] text-[12px] text-[#989898]">
            {accountAddress}
          </div>
        </div>
        <ChevronDown className="w-[16px] h-[16px]" />
      </button>
    </div>
  )
}
