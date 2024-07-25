import { faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
import ChevronDown from "react:~assets/chevronDown.svg"
import Ethereum from "react:~assets/ethereum.svg"
import { useHashLocation } from "wouter/use-hash-location"

import {
  useAccount,
  useAccounts,
  useAction,
  useNetwork,
  useNetworks
} from "~app/hook/storage"
import { Path } from "~app/path"
import address from "~packages/util/address"
import type { Network } from "~storage/local/state"

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
  const [isNetworkSelectorModalOpened, setIsNetworkSelectorModalOpened] =
    useState(false)
  const toggleNetworkSelectorModal = () =>
    setIsNetworkSelectorModalOpened(!isNetworkSelectorModalOpened)
  return (
    <>
      {/* Home page network selector button */}
      <button
        className="p-[12px_20px_12px_20px] flex items-center rounded-full border-[1px] border-solid border-black"
        onClick={toggleNetworkSelectorModal}>
        <Ethereum className="w-[24px] h-[24px] mr-[12px]" />
        <ChevronDown className="w-[16px] h-[16px]" />
      </button>
      {/* Network selector modal */}
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
  const [, navigate] = useHashLocation()
  const account = useAccount()
  return (
    <>
      {/* Home page account selector button */}
      <button
        className="p-[7px_20px_7px_20px] flex items-center rounded-full border-[1px] border-solid border-black"
        onClick={() => navigate(Path.AccountList)}>
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
    </>
  )
}
