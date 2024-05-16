import * as ethers from "ethers"
import { useEffect, useState } from "react"
import { useClsState } from "use-cls-state"
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect"
import { useHashLocation } from "wouter/use-hash-location"

import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import {
  useAccount,
  useNetwork,
  usePendingUserOperationLogs,
  useStorage
} from "~app/storage"
import type { Account, UserOperationLog } from "~background/storage/local"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { UserOperation } from "~packages/bundler"
import type { Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { ETH, Token } from "~packages/token"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

type PaymentOption = {
  name: string
  paymaster: Paymaster
}

type Payment = {
  option: PaymentOption
  token: Token
  tokenFee: bigint
}

export function UserOperationAuthorization() {
  const [, navigate] = useHashLocation()
  const pendingUserOpLogs = usePendingUserOperationLogs()
  if (pendingUserOpLogs.length === 0) {
    navigate(Path.Index)
    return
  }
  return <UserOperationConfirmation userOpLog={pendingUserOpLogs[0]} />
}

function UserOperationConfirmation(props: { userOpLog: UserOperationLog }) {
  const { userOpLog } = props
  const paymentOptions: PaymentOption[] = [
    {
      name: "No Paymaster",
      paymaster: new NullPaymaster()
    },
    // TODO: Put paymaster into config
    {
      name: "Verifying Paymaster",
      paymaster: new VerifyingPaymaster({
        address: process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER,
        ownerPrivateKey:
          process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER_OWNER_PRIVATE_KEY,
        expirationSecs: 300
      })
    }
  ]
  const [, navigate] = useHashLocation()
  const { provider } = useProviderContext()
  const network = useNetwork(userOpLog.networkId)
  const sender = useAccount(userOpLog.senderId)
  const [userOp, setUserOp] = useClsState<UserOperation>(
    new UserOperation(userOpLog.userOp)
  )
  const [payment, setPayment] = useState<Payment>({
    option: paymentOptions[0],
    token: ETH,
    tokenFee: 0n
  })
  const [userOpSending, setUserOpSending] = useState(false)
  const [userOpEstimating, setUserOpEstimating] = useState(false)
  const [paymentCalculating, setPaymentCalculating] = useState(false)

  // TODO: Put it into a dedicated module
  const estimateGasFee = async () => {
    const fee = await provider.getFeeData()
    const gasPriceWithBuffer = (fee.gasPrice * 120n) / 100n
    // TODO: maxFeePerGas and maxPriorityFeePerGas too low error
    return {
      maxFeePerGas: gasPriceWithBuffer,
      maxPriorityFeePerGas: gasPriceWithBuffer
    }
  }

  const onPaymentOptionSelected = async (o: PaymentOption) => {
    // TODO: Be able to select token
    // Should show only tokens imported by user
    setUserOpEstimating(true)
    setPayment({
      ...payment,
      option: o
    })
    userOp.clearGasLimit()
    userOp.setPaymasterAndData(
      await o.paymaster.requestPaymasterAndData(provider, userOp)
    )
    userOp.setGasFee(await estimateGasFee())
    userOp.setGasLimit(
      await provider.send(WaalletRpcMethod.eth_estimateUserOperationGas, [
        userOp.data()
      ])
    )
    setUserOp(userOp)
    setUserOpEstimating(false)
  }
  // Trigger initial gas estimation
  useEffect(() => {
    onPaymentOptionSelected(payment.option)
  }, [])

  const markUserOperationSent = useStorage(
    (storage) => storage.markUserOperationSent
  )
  const sendUserOperation = async () => {
    setUserOpSending(true)

    const account = await createAccount(sender)
    try {
      userOp.setPaymasterAndData(
        await payment.option.paymaster.requestPaymasterAndData(provider, userOp)
      )
      userOp.setSignature(
        await account.sign(
          userOp.hash(userOpLog.entryPointAddress, network.chainId)
        )
      )
      const userOpHash = await provider.send(
        WaalletRpcMethod.eth_sendUserOperation,
        [userOp.data(), userOpLog.entryPointAddress]
      )
      await markUserOperationSent(userOpLog.id, userOpHash, userOp.data())
    } catch (e) {
      // TOOD: Show error on page
      console.error(e)
      setUserOpSending(false)
    }
  }

  const markUserOperationRejected = useStorage(
    (storage) => storage.markUserOperationRejected
  )
  const rejectUserOperation = async () => {
    markUserOperationRejected(userOpLog.id)
    navigate(Path.Index)
    return
  }

  useDeepCompareEffectNoCheck(() => {
    async function updatePayment() {
      setPaymentCalculating(true)
      setPayment({
        ...payment,
        tokenFee: await payment.option.paymaster.quoteFee(
          userOp.calculateGasFee(),
          ETH
        )
      })
      setPaymentCalculating(false)
    }
    updatePayment()
  }, [userOp])

  return (
    <div>
      <div>
        <h1>Transaction Detail</h1>
        <div>
          {Object.entries(userOp.data()).map(([key, value], i) => {
            return (
              <div key={i}>
                {key}: {value}
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <h1>Paymaster Option</h1>
        {paymentOptions.map((o, i) => {
          const id = i.toString()
          const isSelected = o.name === payment.option.name
          return (
            <div key={i}>
              <input
                type="checkbox"
                id={id}
                name={o.name}
                checked={isSelected}
                disabled={paymentCalculating || isSelected}
                onChange={() => onPaymentOptionSelected(o)}
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
          {ethers.formatEther(userOp ? userOp.calculateGasFee() : 0n)}{" "}
          {ETH.symbol}
        </p>
        <p>
          Expected to pay:{" "}
          {paymentCalculating
            ? "Calculating..."
            : `${ethers.formatUnits(
                payment.tokenFee,
                payment.token.decimals
              )} ${payment.token.symbol}`}
        </p>
      </div>
      <div style={{ marginTop: "1em" }}>
        <button
          disabled={userOpEstimating || paymentCalculating || userOpSending}
          onClick={sendUserOperation}>
          Send
        </button>
        <button disabled={userOpSending} onClick={rejectUserOperation}>
          Reject
        </button>
      </div>
    </div>
  )
}

// TODO: Redesign a place to accommodate it
async function createAccount(account: Account) {
  switch (account.type) {
    case AccountType.SimpleAccount:
      return SimpleAccount.init({
        address: account.address,
        ownerPrivateKey: account.ownerPrivateKey
      })
    case AccountType.PasskeyAccount:
      return PasskeyAccount.init({
        address: account.address,
        owner: new PasskeyOwnerWebAuthn(account.credentialId)
      })
    default:
      throw new Error(`Unknown account ${account}`)
  }
}
