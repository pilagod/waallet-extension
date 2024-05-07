import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"

import { useAccount, useNetwork } from "~app/storage"
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
        <AccountModal onModalClosed={toggleAccountModal} />
      )}
    </nav>
  )
}

function AccountModal(props: { onModalClosed: () => void }) {
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
        <div>
          <span>This is account modal</span>
        </div>
        <div>
          <span>This is account modal</span>
        </div>
        <div>
          <span>This is account modal</span>
        </div>
      </div>
    </div>
  )
}
