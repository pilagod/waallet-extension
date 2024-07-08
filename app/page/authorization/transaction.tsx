import * as ethers from "ethers"
import { useEffect, useState } from "react"
import { useHashLocation } from "wouter/use-hash-location"

import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import { useAccount, useNetwork, usePendingTransactions } from "~app/storage"
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
  // TODO: Should switch active network for each transaction
  return <TransactionConfirmation tx={pendingTxs[0]} />
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
    return <></>
  }

  return (
    <div>
      <div>
        <h1>Transaction Detail</h1>
        <div>
          {Object.entries(userOp.unwrap()).map(([key, value], i) => {
            return (
              <div key={i}>
                {key}: {`${value}`}
              </div>
            )
          })}
        </div>
      </div>
      <div>
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
                disabled={paymentCalculating || isSelected}
                onChange={() => setPaymentOption(o)}
              />
              <label htmlFor={id}>{o.name}</label>
            </div>
          )
        })}
      </div>
      <div>
        <h1>Transaction Cost</h1>
        <p>
          Estimated gas fee:{" "}
          {userOpEstimating || paymentCalculating
            ? "Estimating..."
            : `${ethers.formatEther(userOp ? userOp.calculateGasFee() : 0n)} ${
                ETH.symbol
              }`}
        </p>
        <p>
          Expected to pay:{" "}
          {userOpEstimating || paymentCalculating
            ? "Calculating..."
            : `${ethers.formatUnits(
                payment.tokenFee,
                payment.token.decimals
              )} ${payment.token.symbol}`}
        </p>
      </div>
      <div className="mt-1">
        <button
          disabled={paymentCalculating || userOpEstimating || userOpResolving}
          onClick={sendUserOperation}>
          Send
        </button>
        <button disabled={userOpResolving} onClick={rejectUserOperation}>
          Reject
        </button>
      </div>
    </div>
  )
}
