import { useContext, useState } from "react"
import { useHashLocation } from "wouter/use-hash-location"

import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { Input } from "~app/component/input"
import { PasskeyVerification } from "~app/component/passkeyVerification"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { ProviderContext } from "~app/context/provider"
import { ToastContext } from "~app/context/toastContext"
import { useAction, useNetwork } from "~app/hook/storage"
import { Path } from "~app/path"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import address from "~packages/util/address"
import number from "~packages/util/number"

export function AccountCreate() {
  const [, navigate] = useHashLocation()
  const { provider } = useContext(ProviderContext)
  const { setToast } = useContext(ToastContext)

  const { createPasskeyAccount } = useAction()
  const network = useNetwork()

  const [accountName, setAccountName] = useState("")
  const [accountCreating, setAccountCreating] = useState(false)
  const onAccountNameChanged = (value: string) => {
    setAccountName(value)
  }
  const createNewAccount = async () => {
    setAccountCreating(true)
    try {
      if (
        !address.isValid(network.accountFactory[AccountType.PasskeyAccount])
      ) {
        throw new Error("Passkey account factory is not set")
      }
      const account = await PasskeyAccount.initWithFactory(provider, {
        owner: await PasskeyOwnerWebAuthn.register(),
        factory: network.accountFactory[AccountType.PasskeyAccount],
        salt: number.random()
      })
      await createPasskeyAccount(accountName, account, network.id)
      setToast("Account created!", "success")
      navigate(Path.Home)
    } catch (e) {
      console.error(e)
    } finally {
      setAccountCreating(false)
    }
  }

  if (accountCreating) {
    return <PasskeyVerification purpose="identity" />
  }

  return (
    <>
      <StepBackHeader
        title="Add New Account"
        onStepBack={() => {
          history.back()
        }}
      />

      {/* Account Name */}
      <section className="h-[373px] pt-[24px]">
        <Input
          label="Set account name"
          name="accountName"
          value={accountName}
          placeholder="Enter account name"
          onValueChanged={onAccountNameChanged}
        />
      </section>

      <Divider />

      {/* Create New Account */}
      <section className="pt-[22.5px]">
        <Button
          className="text-[18px] !font-[600]"
          text="Create new account"
          variant="black"
          disabled={accountName.length === 0}
          onClick={createNewAccount}></Button>
      </section>
    </>
  )
}
