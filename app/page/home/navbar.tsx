import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { formatEther } from "ethers"
import { useContext, useEffect, useState } from "react"
import ChevronDown from "react:~assets/chevronDown.svg"
import { useHashLocation } from "wouter/use-hash-location"

import { ProviderContext } from "~app/context/provider"
import {
  useAccount,
  useAccounts,
  useAction,
  useNetwork
} from "~app/hook/storage"
import { Path } from "~app/path"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { Account } from "~storage/local/state"

export function Navbar() {
  const hasNoAccount = useAccounts().length === 0
  return (
    <>
      {/* Home page navbar */}
      <nav className="flex items-center justify-between mb-[16px] mt-[4px]">
        <div>
          {hasNoAccount ? <NullAccountSelector /> : <AccountSelector />}
        </div>
        <div>
          <NetworkSelector />
        </div>
      </nav>
    </>
  )
}

function NetworkSelector() {
  const [, navigate] = useHashLocation()
  const network = useNetwork()
  return (
    <>
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
    </>
  )
}

function NullAccountSelector() {
  return (
    <div>
      <span>No account available</span>
    </div>
  )
}

function AccountSelector() {
  const account = useAccount()
  const [isAccountSelectorModalOpened, setIsAccountSelectorModalOpened] =
    useState(false)
  const toggleAccountSelectorModal = () =>
    setIsAccountSelectorModalOpened(!isAccountSelectorModalOpened)
  return (
    <>
      {/* Home page account selector button */}
      <button
        className="p-[7px_20px_7px_20px] flex items-center rounded-full border-[1px] border-solid border-black"
        onClick={toggleAccountSelectorModal}>
        <div className="mr-[12px] flex flex-col items-start">
          <div className="leading-[19.4px] text-[16px] text-[#000000] whitespace-nowrap">
            Jesse's wallet
          </div>
          <div className="leading-[14.6px] text-[12px] text-[#989898]">
            {address.ellipsize(account.address)}
          </div>
        </div>
        <ChevronDown className="w-[16px] h-[16px]" />
      </button>
      {/* Account selector modal */}
      {isAccountSelectorModalOpened && (
        <AccountSelectorModal onModalClosed={toggleAccountSelectorModal} />
      )}
    </>
  )
}

function AccountSelectorModal(props: { onModalClosed: () => void }) {
  const { provider } = useContext(ProviderContext)
  const { createAccount, switchAccount } = useAction()
  const network = useNetwork()
  const accounts = useAccounts()

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
    props.onModalClosed()
  }

  const onAccountSelected = async (accountId: string) => {
    await switchAccount(accountId)
    props.onModalClosed()
  }

  return (
    <div className="absolute top-0 left-0 w-screen h-screen p-4">
      <div
        className="absolute top-0 left-0 w-full h-full bg-black/75"
        onClick={props.onModalClosed}
      />
      <div className="relative w-full p-4 bg-white rounded">
        <div className="absolute top-4 right-4">
          <button onClick={props.onModalClosed}>
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
        {accounts.map((a, i) => (
          <AccountPreview
            key={i}
            account={a}
            active={network.accountActive === a.id}
            onAccountSelected={() => onAccountSelected(a.id)}
          />
        ))}
        <div className="mt-4">
          <button
            className="w-full border-2 border-black rounded-full"
            onClick={onPasskeyAccountCreated}>
            Create new AA account
          </button>
        </div>
      </div>
    </div>
  )
}

function AccountPreview(props: {
  account: Account
  active: boolean
  onAccountSelected: () => void
}) {
  const { provider } = useContext(ProviderContext)
  const [balance, setBalance] = useState<bigint>(null)
  useEffect(() => {
    async function getBalance() {
      const balance = await provider.getBalance(props.account.address)
      setBalance(balance)
    }
    getBalance()
  }, [])
  return (
    <div
      className={
        "pl-2 cursor-pointer hover:bg-black/20" +
        (props.active ? " bg-black/10 border-l-2 border-l-black" : "")
      }
      onClick={props.onAccountSelected}>
      <div>
        <span>{props.account.address}</span>
      </div>
      <div>
        {balance !== null ? (
          <span>{formatEther(balance)}</span>
        ) : (
          // TODO: Extract shared component
          <span className="w-4 h-4 inline-block border border-solid border-white border-b-black rounded-full animate-spin"></span>
        )}
        <span> ETH</span>
      </div>
    </div>
  )
}
