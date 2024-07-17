import Wallet from "react:~assets/wallet"

import type { HexString } from "~typing"

export const AccountItem = ({ address }: { address: HexString }) => {
  return (
    <div className="flex gap-[12px] items-center">
      <Wallet />
      <div className="py-[16px] w-[322px]">
        <h3 className="text-[16px] break-words text-left">{address}</h3>
      </div>
    </div>
  )
}
