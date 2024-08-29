import Wallet from "react:~assets/wallet"

import { Address } from "~packages/primitive"

export const AccountItem = ({ address }: { address: Address }) => {
  return (
    <div className="flex gap-[12px] items-center">
      <div>
        <Wallet />
      </div>
      <div className="min-w-0">
        <h3 className="text-[16px] break-words text-left">
          {address.toString()}
        </h3>
      </div>
    </div>
  )
}
