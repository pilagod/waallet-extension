import Plus from "react:~assets/plus"
import Wallet from "react:~assets/wallet"

import { Divider } from "~app/component/divider"
import { StepBackHeader } from "~app/component/stepBackHeader"

export function WalletList() {
  return (
    <>
      <StepBackHeader title="Wallet List" />

      {/* Total Balance */}
      <section className="py-[16px]">
        <div className="mb-[8px] text-[16px]">Total Balance</div>
        <div className="text-[48px]">$ 13,986.45</div>
      </section>

      {/* Wallet List */}
      <section className="h-[264px] overflow-y-scroll">
        <WalletItem />
        <WalletItem />
        <WalletItem />
        <WalletItem />
        <WalletItem />
        <WalletItem />
        <WalletItem />
        <WalletItem />
      </section>

      <Divider />

      {/* Create New Wallet */}
      <section className="mt-[22.5px]">
        <button className="w-full flex flex-row justify-center items-center py-[16px] border-[1px] border-solid border-black rounded-full">
          <span className="mr-[8px]">
            <Plus />
          </span>
          <span className="text-[18px]">Create new wallet</span>
        </button>
      </section>
    </>
  )
}

function WalletItem() {
  return (
    <div className="flex flex-row items-center py-[16px] text-[16px]">
      <div className="basis-[24px]">
        <Wallet />
      </div>
      <div className="grow mx-[12px]">
        <div>Jesse’s wallet</div>
        <div className="text-[12px]">0xd85...0cef1</div>
      </div>
      <div className="basis-[80px]">$3,986.45</div>
    </div>
  )
}
