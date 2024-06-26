import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { formatEther } from "ethers"
import { useEffect, useState } from "react"

import { useProviderContext } from "~app/context/provider"
import {
  useAccount,
  useAccounts,
  useAction,
  useNetwork,
  useNetworks,
  useShouldOnboard
} from "~app/storage"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { Account, Network } from "~storage/local/state"

export function Navbar() {
  const shouldOnboard = useShouldOnboard()
  return (
    <nav className="w-full grid grid-cols-5 justify-items-center py-4">
      <div className="col-span-1">
        <NetworkSelector />
      </div>
      <div className="col-span-3">
        {shouldOnboard ? <NullAccountSelector /> : <AccountSelector />}
      </div>
    </nav>
  )
}

function NetworkSelector() {
  const network = useNetwork()
  const [isNetworkSelectorModalOpened, setIsNetworkSelectorModalOpened] =
    useState(false)
  const toggleNetworkSelectorModal = () =>
    setIsNetworkSelectorModalOpened(!isNetworkSelectorModalOpened)
  return (
    <>
      <div className="cursor-pointer" onClick={toggleNetworkSelectorModal}>
        <span>{network.name}</span>
        <FontAwesomeIcon icon={faCaretDown} className="ml-2" />
      </div>
      {isNetworkSelectorModalOpened && (
        <NetworkSelectorModal onModalClosed={toggleNetworkSelectorModal} />
      )}
    </>
  )
}
function NetworkSelectorModal(props: { onModalClosed: () => void }) {
  const { switchNetwork } = useAction()
  const network = useNetwork()
  const networks = useNetworks()

  const onNetworkSelected = async (networkId: string) => {
    await switchNetwork(networkId)
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
        <div className="my-2 text-center">
          <h1>Select Network</h1>
        </div>
        {networks.map((n, i) => {
          return (
            <NetworkPreview
              key={i}
              network={n}
              active={network.id === n.id}
              onNetworkSelected={() => onNetworkSelected(n.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

function NetworkPreview(props: {
  active: boolean
  network: Network
  onNetworkSelected: () => void
}) {
  return (
    <div
      className={
        "p-2 cursor-pointer hover:bg-black/20" +
        (props.active ? " bg-black/10 border-l-2 border-l-black" : "")
      }
      onClick={props.onNetworkSelected}>
      <div>
        <span>{props.network.name}</span>
      </div>
    </div>
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
      <div className="cursor-pointer" onClick={toggleAccountSelectorModal}>
        <span>{address.ellipsize(account.address)}</span>
        <FontAwesomeIcon icon={faCaretDown} className="ml-2" />
      </div>
      {isAccountSelectorModalOpened && (
        <AccountSelectorModal onModalClosed={toggleAccountSelectorModal} />
      )}
    </>
  )
}

function AccountSelectorModal(props: { onModalClosed: () => void }) {
  const { provider } = useProviderContext()
  const { createAccount, switchAccount } = useAction()
  const network = useNetwork()
  const account = useAccount()
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
            active={account.id === a.id}
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
  const { provider } = useProviderContext()
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
