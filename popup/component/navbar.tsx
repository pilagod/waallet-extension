import { useShallow } from "zustand/react/shallow"

import address from "~packages/util/address"
import { useStorage } from "~popup/storage"

export function Navbar() {
  const network = useStorage(
    useShallow((storage) => storage.state.network[storage.state.networkActive])
  )
  return (
    <nav className="w-full grid grid-cols-5 justify-items-center my-4">
      <div>{network.chainId}</div>
      <div className="col-span-3">
        {address.ellipsize(network.accountActive)}
      </div>
    </nav>
  )
}
