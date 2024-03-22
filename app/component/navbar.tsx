import { useAccount, useNetwork } from "~app/storage"
import address from "~packages/util/address"

export function Navbar() {
  const network = useNetwork()
  const account = useAccount()
  return (
    <nav className="w-full grid grid-cols-5 justify-items-center my-4">
      <div>{network.chainId}</div>
      <div className="col-span-3">{address.ellipsize(account.address)}</div>
    </nav>
  )
}
