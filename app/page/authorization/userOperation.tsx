import * as ethers from "ethers"
import { useEffect, useState } from "react"
import { useClsState } from "use-cls-state"
import { useHashLocation } from "wouter/use-hash-location"

import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import {
  useAccount,
  useAction,
  useNetwork,
  usePendingUserOperationLogs
} from "~app/storage"
import type { Account } from "~packages/account"
import { UserOperation } from "~packages/bundler"
import type { Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { ETH, Token } from "~packages/token"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { UserOperationLog } from "~storage/local"
import { AccountStorageManager } from "~storage/local/manager"

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
  const [, navigate] = useHashLocation()
  const { markUserOperationSent, markUserOperationRejected } = useAction()
  const network = useNetwork(userOpLog.networkId)
  const sender = useAccount(userOpLog.senderId)

  /* Account */

  const [senderAccount, setSenderAccount] = useState<Account>(null)

  useEffect(() => {
    async function setupSenderAccount() {
      const account = await AccountStorageManager.wrap(provider, sender)
      setSenderAccount(account)
    }
    setupSenderAccount()
  }, [sender.id])

  /* User Operation */

  const [userOp, setUserOp] = useClsState<UserOperation>(
    new UserOperation(userOpLog.userOp)
  )
  const [userOpSending, setUserOpSending] = useState(false)
  const [userOpEstimating, setUserOpEstimating] = useState(false)

  const sendUserOperation = async () => {
    setUserOpSending(true)

    try {
      userOp.setPaymaster(
        await payment.option.paymaster.requestPaymasterAndData(userOp)
      )
      userOp.setSignature(
        await senderAccount.sign(
          userOp.hash(userOpLog.entryPointAddress, network.chainId)
        )
      )
      const userOpHash = await provider.send(
        WaalletRpcMethod.eth_sendUserOperation,
        [userOp.data(), userOpLog.entryPointAddress]
      )
      if (!userOpHash) {
        throw new Error("Fail to send user operation")
      }
      await markUserOperationSent(userOpLog.id, userOpHash, userOp.data())
    } catch (e) {
      // TOOD: Show error on page
      console.error(e)
      setUserOpSending(false)
    }
  }

  const rejectUserOperation = async () => {
    await markUserOperationRejected(userOpLog.id)
    navigate(Path.Index)
    return
  }

  useEffect(() => {
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
  }, [JSON.stringify(userOp.data())])

  /* Payment */

  const [payment, setPayment] = useState<Payment>({
    option: paymentOptions[0],
    token: ETH,
    tokenFee: 0n
  })
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
    userOp.setPaymaster(await o.paymaster.requestPaymasterAndData(userOp, true))
    userOp.setGasFee(await estimateGasFee())
    // TODO: Refine account usage
    userOp.setGasLimit(
      await provider.send(WaalletRpcMethod.eth_estimateUserOperationGas, [
        userOp.data(),
        await senderAccount.getEntryPoint()
      ])
    )
    setUserOp(userOp)
    setUserOpEstimating(false)
  }
  // Trigger initial gas estimation
  useEffect(() => {
    if (!senderAccount) {
      return
    }
    onPaymentOptionSelected(payment.option)
  }, [senderAccount])

  if (!senderAccount) {
    return <></>
  }

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
      <div className="mt-1">
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
