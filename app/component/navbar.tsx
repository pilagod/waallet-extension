import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { formatEther } from "ethers"
import { useEffect, useState } from "react"

import { useProviderContext } from "~app/context/provider"
import { useAccount, useAccounts, useNetwork } from "~app/storage"
import { type Account } from "~background/storage/local"
import address from "~packages/util/address"

export function Navbar() {
  const network = useNetwork()
  const account = useAccount()
  const [isAccountModalOpened, setIsAccountModalOpened] = useState(false)
  const toggleAccountModal = () =>
    setIsAccountModalOpened(!isAccountModalOpened)
  return (
    <nav className="w-full grid grid-cols-5 justify-items-center my-4">
      <div>{network.chainId}</div>
      <div className="col-span-3 cursor-pointer" onClick={toggleAccountModal}>
        <span>{address.ellipsize(account.address)}</span>
        <FontAwesomeIcon icon={faCaretDown} className="ml-2" />
      </div>
      {isAccountModalOpened && (
        <AccountModal selected={account} onModalClosed={toggleAccountModal} />
      )}
    </nav>
  )
}

function AccountModal(props: { selected: Account; onModalClosed: () => void }) {
  const accounts = useAccounts()
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
        {accounts.map((a) => (
          <AccountPreview
            account={a}
            active={props.selected.address === a.address}
          />
        ))}
      </div>
    </div>
  )
}

function AccountPreview(props: { account: Account; active: boolean }) {
  const { provider } = useProviderContext()
  const [balance, setBalance] = useState(0n)
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
      }>
      <div>
        <span>{props.account.address}</span>
      </div>
      <div>
        {balance ? (
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
