import Wallet from "react:~assets/wallet"

import type { HexString } from "~typing"

export const AccountItem = ({ address }: { address: HexString }) => {
  return (
    <div className="flex gap-[12px] items-center">
      <div>
        <Wallet />
      </div>
      <div className="min-w-0">
        <h3 className="text-[16px] py-[16px] break-words text-left">
          {address}
        </h3>
      </div>
    </div>
  )
}
