import CircleCheck from "react:~assets/circleCheck"
import Plus from "react:~assets/plus"
import Wallet from "react:~assets/wallet"
import { useHashLocation } from "wouter/use-hash-location"

import { Divider } from "~app/component/divider"
import { ScrollableWrapper } from "~app/component/scrollableWrapper"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { useAccounts, useAction, useNetwork } from "~app/hook/storage"
import { Path } from "~app/path"
import { Address } from "~packages/primitive"
import number from "~packages/util/number"
import type { HexString } from "~typing"

export function AccountList() {
  const [, navigate] = useHashLocation()
  const { switchAccount } = useAction()

  const accounts = useAccounts()
  const network = useNetwork()

  const totalBalance = accounts.reduce((b, a) => {
    return b + number.toBigInt(a.balance)
  }, 0n)
  const selectAccount = async (accountId: string) => {
    await switchAccount(accountId)
    navigate(Path.Home)
  }

  return (
    <>
      <StepBackHeader title="Account List" />

      {/* Total Balance */}
      <section className="py-[16px]">
        <div className="mb-[8px] text-[16px]">Total Balance</div>
        <div className="text-[48px]">
          {number.formatUnitsToFixed(totalBalance, 18, 2)} {network.tokenSymbol}
        </div>
      </section>

      {/* Account List */}
      <ScrollableWrapper className="h-[264px]">
        <section>
          {accounts.map((a, i) => {
            return (
              <div
                key={i}
                className="cursor-pointer hover:bg-[#F5F5F5]"
                onClick={() => selectAccount(a.id)}>
                <AccountItem
                  name={a.name}
                  address={a.address}
                  balance={number.toBigInt(a.balance)}
                  active={a.id === network.accountActive}
                  tokenSymbol={network.tokenSymbol}
                />
              </div>
            )
          })}
        </section>
      </ScrollableWrapper>

      <Divider />

      {/* Create New Account */}
      <section className="pt-[22.5px]">
        <button
          className="w-full flex flex-row justify-center items-center py-[16px] border-[1px] border-solid border-black rounded-full"
          onClick={() => navigate(Path.AccountCreate)}>
          <span className="mr-[8px]">
            <Plus />
          </span>
          <span className="text-[18px]">Create new account</span>
        </button>
      </section>
    </>
  )
}

function AccountItem(props: {
  name: string
  address: HexString
  balance: bigint
  active: boolean
  tokenSymbol: string
}) {
  // Effect of `min-w-0`:
  // https://stackoverflow.com/questions/36230944/prevent-flex-items-from-overflowing-a-container
  return (
    <div
      className={`flex flex-row items-center gap-[12px] p-[16px] text-[16px] ${
        props.active && "bg-[#F5F5F5]"
      }`}>
      <div className="basis-[24px]">
        {props.active ? <CircleCheck /> : <Wallet />}
      </div>
      <div className="min-w-0 grow break-words">
        <div>{props.name}</div>
        <div className="text-[12px]">
          {Address.wrap(props.address).ellipsize()}
        </div>
      </div>
      <div className="min-w-0 basis-[120px] text-right">
        {number.formatUnitsToFixed(props.balance, 18, 2)} {props.tokenSymbol}
      </div>
    </div>
  )
}
