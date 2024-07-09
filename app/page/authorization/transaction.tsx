import * as ethers from "ethers"
import { useEffect, useState } from "react"
import Gas from "react:~assets/gas"
import Wallet from "react:~assets/wallet"
import { useHashLocation } from "wouter/use-hash-location"

import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { Header } from "~app/component/header"
import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import {
  useAccount,
  useAction,
  useNetwork,
  usePendingTransactions
} from "~app/storage"
import type { Account } from "~packages/account"
import type { Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { ETH } from "~packages/token"
import { AccountStorageManager } from "~storage/local/manager"
import { type Network, type TransactionPending } from "~storage/local/state"

import { usePayment } from "./usePayment"
import { useUserOperation } from "./useUserOperation"

export type PaymentOption = {
  name: string
  paymaster: Paymaster
}

export function TransactionAuthorization() {
  const [, navigate] = useHashLocation()
  const pendingTxs = usePendingTransactions()
  if (pendingTxs.length === 0) {
    navigate(Path.Index)
    return
  }
  const [tx] = pendingTxs

  return (
    <ProfileSwithcher accountId={tx.senderId} networkId={tx.networkId}>
      <TransactionConfirmation tx={tx} />
    </ProfileSwithcher>
  )
}

function ProfileSwithcher(props: {
  accountId: string
  networkId: string
  children: React.ReactNode
}) {
  const { accountId, networkId, children } = props

  const { switchProfile } = useAction()

  const [profileSwitching, setProfileSwitching] = useState(false)

  useEffect(() => {
    setProfileSwitching(true)
    switchProfile({ accountId, networkId }).then(() => {
      setProfileSwitching(false)
    })
  }, [accountId, networkId])

  if (profileSwitching) {
    return
  }

  return children
}

function TransactionConfirmation(props: { tx: TransactionPending }) {
  const { tx } = props

  const { provider } = useProviderContext()
  const network = useNetwork(tx.networkId)
  const sender = useAccount(tx.senderId)

  const [senderAccount, setSenderAccount] = useState<Account>(null)

  useEffect(() => {
    async function setupSenderAccount() {
      const account = await AccountStorageManager.wrap(provider, sender)
      setSenderAccount(account)
    }
    setupSenderAccount()
  }, [sender.id])

  if (!senderAccount) {
    return
  }

  return (
    <UserOperationConfirmation
      tx={tx}
      sender={senderAccount}
      network={network}
    />
  )
}

function UserOperationConfirmation(props: {
  tx: TransactionPending
  sender: Account
  network: Network
}) {
  const { tx, sender, network } = props

  const { provider } = useProviderContext()

  const paymentOptions: PaymentOption[] = [
    {
      name: "No Paymaster",
      paymaster: new NullPaymaster()
    },
    // TODO: Put paymaster into config
    {
      name: "Verifying Paymaster",
      paymaster: new VerifyingPaymaster(provider, {
        address: process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER,
        ownerPrivateKey:
          process.env
            .PLASMO_PUBLIC_VERIFYING_PAYMASTER_VERIFYING_SIGNER_PRIVATE_KEY,
        expirationSecs: 300
      })
    }
  ]

  const [paymentOption, setPaymentOption] = useState<PaymentOption>(
    paymentOptions[0]
  )
  const {
    userOp,
    userOpResolving,
    sendUserOperation,
    rejectUserOperation,
    userOpEstimating
  } = useUserOperation({ ...props, paymentOption })

  const { payment, paymentCalculating } = usePayment({ userOp, paymentOption })

  if (!userOp) {
    return
  }
  return (
    <>
      <Header title={"Send"} href={Path.Index}>
        <div className="text-[48px]">1.2 ETH</div>
      </Header>
      <section className="py-[16px] text-[16px]">
        <h2 className="py-[12px]">From</h2>
        <div className="flex gap-[12px] items-center">
          <Wallet />
          <div className="w-[322px] py-[9.5px]">
            <h3>Jesse's wallet</h3>
            <h4 className="text-[#989898] ">{userOp.sender}</h4>
          </div>
        </div>
        <h2 className="py-[12px]">To</h2>
        <div className="flex gap-[12px] items-center">
          <Wallet />
          <div className="py-[16px] w-[322px]">
            <h3>{props.tx.to}</h3>
          </div>
        </div>
      </section>
      <Divider />
      <section className="py-[16px] text-[16px]">
        <h2 className="py-[8px]">Est. gas fee</h2>
        <div className="flex gap-[12px] py-[16px]">
          <Gas />
          <p>
            {userOpEstimating || paymentCalculating
              ? "Estimating..."
              : `${ethers.formatEther(
                  userOp ? userOp.calculateGasFee() : 0n
                )} ${ETH.symbol}`}
          </p>
          <p>= ~$ ? USD</p>
        </div>
      </section>

      <div className="py-[22.5px] flex justify-between gap-[16px] text-[18px] font-semibold">
        <Button
          disabled={userOpResolving}
          onClick={rejectUserOperation}
          buttonText="Cancel"
          className="white-button"
        />
        <Button
          disabled={paymentCalculating || userOpEstimating || userOpResolving}
          onClick={sendUserOperation}
          buttonText="Send"
          className="black-button"
        />
      </div>
      {/* <div>
        <h1>Paymaster Option</h1>
        {paymentOptions.map((o, i) => {
          const id = i.toString()
          const isSelected = o.name === paymentOption.name
          return (
            <div key={i}>
              <input
                type="checkbox"
                id={id}
                name={o.name}
                checked={isSelected}
                disabled={paymentCalculating || isSelected || userOpEstimating}
                onChange={() => setPaymentOption(o)}
              />
              <label htmlFor={id}>{o.name}</label>
            </div>
          )
        })}
      </div> */}

      {/* <div>
        <div>
          <h2>From: {userOp.sender}</h2>
          <h2>To: {props.tx.to}</h2>
        </div>
        <div>
          {Object.entries(userOp.unwrap()).map(([key, value], i) => {
            return (
              <div key={i}>
                {key}: {`${value}`}
              </div>
            )
          })}
        </div>
      </div> */}

      {/* <div>
        <h1>Transaction Cost</h1>
        <p>
          Expected to pay:{" "}
          {userOpEstimating || paymentCalculating
            ? "Calculating..."
            : `${ethers.formatUnits(
                payment.tokenFee,
                payment.token.decimals
              )} ${payment.token.symbol}`}
        </p>
      </div> */}
    </>
  )
}
