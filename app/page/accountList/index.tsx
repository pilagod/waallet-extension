import { useContext, useState } from "react"
import CircleCheck from "react:~assets/circleCheck"
import Plus from "react:~assets/plus"
import Wallet from "react:~assets/wallet"
import { useHashLocation } from "wouter/use-hash-location"

import { Divider } from "~app/component/divider"
import { PasskeyVerification } from "~app/component/passkeyVerification"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { ProviderContext } from "~app/context/provider"
import { ToastContext } from "~app/context/toastContext"
import { useAccounts, useAction, useNetwork } from "~app/hook/storage"
import { Path } from "~app/path"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { HexString } from "~typing"

export function AccountList() {
  const [, navigate] = useHashLocation()
  const { provider } = useContext(ProviderContext)
  const { setToast } = useContext(ToastContext)
  const { createAccount, switchAccount } = useAction()

  const network = useNetwork()

  const accounts = useAccounts()
  const totalBalance = accounts.reduce((b, a) => {
    return b + number.toBigInt(a.balance)
  }, 0n)

  const [accountCreating, setAccountCreating] = useState(false)
  const createNewAccount = async () => {
    setAccountCreating(true)
    try {
      if (!network.accountFactory[AccountType.PasskeyAccount]) {
        throw new Error("Passkey account factory is not set")
      }
      const account = await PasskeyAccount.initWithFactory(provider, {
        owner: await PasskeyOwnerWebAuthn.register(),
        salt: number.random(),
        factoryAddress: network.accountFactory[AccountType.PasskeyAccount]
      })
      await createAccount(account, network.id)
      setToast("Account created!", "success")
      navigate(Path.Home)
    } catch (e) {
      console.error(e)
    } finally {
      setAccountCreating(false)
    }
  }
  const selectAccount = async (accountId: string) => {
    await switchAccount(accountId)
    navigate(Path.Home)
  }

  if (accountCreating) {
    return <PasskeyVerification purpose="identity" />
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
      <section className="w-[calc(100%+32px)] h-[264px] ml-[-16px] overflow-x-hidden overflow-y-scroll">
        {accounts.map((a, i) => {
          return (
            <div
              key={i}
              className="cursor-pointer hover:bg-[#F5F5F5]"
              onClick={() => selectAccount(a.id)}>
              <AccountItem
                address={a.address}
                balance={number.toBigInt(a.balance)}
                active={a.id === network.accountActive}
                tokenSymbol={network.tokenSymbol}
              />
            </div>
          )
        })}
      </section>

      <Divider />

      {/* Create New Account */}
      <section className="pt-[22.5px]">
        <button
          className="w-full flex flex-row justify-center items-center py-[16px] border-[1px] border-solid border-black rounded-full"
          onClick={createNewAccount}>
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
        <div>Jesse’s wallet</div>
        <div className="text-[12px]">{address.ellipsize(props.address)}</div>
      </div>
      <div className="min-w-0 basis-[120px] text-right">
        {number.formatUnitsToFixed(props.balance, 18, 2)} {props.tokenSymbol}
      </div>
    </div>
  )
}
