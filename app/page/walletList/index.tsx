import { useState } from "react"
import Plus from "react:~assets/plus"
import Wallet from "react:~assets/wallet"
import { useHashLocation } from "wouter/use-hash-location"

import { Divider } from "~app/component/divider"
import { PasskeyVerification } from "~app/component/passkeyVerification"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { useAccounts, useAction } from "~app/hook/storage"
import { Path } from "~app/path"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { HexString } from "~typing"

export function WalletList() {
  const [, navigate] = useHashLocation()
  const { switchAccount } = useAction()

  const accounts = useAccounts()
  const totalBalance = accounts.reduce((b, a) => {
    return b + number.toBigInt(a.balance)
  }, 0n)

  const [walletCreating, setWalletCreating] = useState(false)
  const createWallet = () => {
    setWalletCreating(true)
  }
  const selectWallet = async (accountId: string) => {
    await switchAccount(accountId)
    navigate(Path.Home)
  }
  if (walletCreating) {
    return <PasskeyVerification purpose="identity" />
  }

  return (
    <>
      <StepBackHeader title="Wallet List" />

      {/* Total Balance */}
      <section className="py-[16px]">
        <div className="mb-[8px] text-[16px]">Total Balance</div>
        <div className="text-[48px]">
          {number.formatUnitsToFixed(totalBalance, 18, 2)} ETH
        </div>
      </section>

      {/* Wallet List */}
      <section className="h-[264px] overflow-x-hidden overflow-y-scroll">
        {accounts.map((a, i) => {
          return (
            <div
              key={i}
              className="cursor-pointer"
              onClick={() => selectWallet(a.id)}>
              <WalletItem
                address={a.address}
                balance={number.toBigInt(a.balance)}
              />
            </div>
          )
        })}
      </section>

      <Divider />

      {/* Create New Wallet */}
      <section className="pt-[22.5px]">
        <button
          className="w-full flex flex-row justify-center items-center py-[16px] border-[1px] border-solid border-black rounded-full"
          onClick={createWallet}>
          <span className="mr-[8px]">
            <Plus />
          </span>
          <span className="text-[18px]">Create new wallet</span>
        </button>
      </section>
    </>
  )
}

function WalletItem(props: { address: HexString; balance: bigint }) {
  // Effect of `min-w-0`:
  // https://stackoverflow.com/questions/36230944/prevent-flex-items-from-overflowing-a-container
  return (
    <div className="flex flex-row items-center gap-[12px] py-[16px] text-[16px]">
      <div className="basis-[24px]">
        <Wallet />
      </div>
      <div className="min-w-0 grow break-words">
        <div>Jesse’s wallet</div>
        <div className="text-[12px]">{address.ellipsize(props.address)}</div>
      </div>
      <div className="min-w-0 basis-[120px] text-right">
        {number.formatUnitsToFixed(props.balance, 18, 2)} ETH
      </div>
    </div>
  )
}