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
  usePendingTransactions
} from "~app/storage"
import type { Account } from "~packages/account"
import { UserOperation } from "~packages/bundler"
import type { Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { ETH } from "~packages/token"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import type { TransactionPending } from "~storage/local"
import { AccountStorageManager } from "~storage/local/manager"

type PaymentOption = {
  name: string
  paymaster: Paymaster
}

export function UserOperationAuthorization() {
  const [, navigate] = useHashLocation()
  const pendingTxs = usePendingTransactions()
  if (pendingTxs.length === 0) {
    navigate(Path.Index)
    return
  }
  return <UserOperationConfirmation pendingTx={pendingTxs[0]} />
}

function UserOperationConfirmation(props: { pendingTx: TransactionPending }) {
  const { pendingTx } = props
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
  const { markERC4337v06TransactionSent, markERC4337v06TransactionRejected } =
    useAction()
  const network = useNetwork(pendingTx.networkId)
  const sender = useAccount(pendingTx.senderId)

  /* Account */

  const [senderAccount, setSenderAccount] = useState<Account>(null)

  useEffect(() => {
    async function setupSenderAccount() {
      const account = await AccountStorageManager.wrap(provider, sender)
      setSenderAccount(account)
    }
    setupSenderAccount()
  }, [sender.id])

  /* Payment */

  const [paymentOption, setPaymentOption] = useState<PaymentOption>(
    paymentOptions[0]
  )
  const [payment, setPayment] = useState({
    token: ETH,
    tokenFee: 0n
  })
  const [paymentCalculating, setPaymentCalculating] = useState(false)

  /* User Operation */

  const [userOp, setUserOp] = useClsState<UserOperation>(null)
  const [userOpResolving, setUserOpResolving] = useState(false)
  const [userOpEstimating, setUserOpEstimating] = useState(false)

  const sendUserOperation = async () => {
    setUserOpResolving(true)
    try {
      const entryPoint = await senderAccount.getEntryPoint()

      userOp.setPaymasterAndData(
        await paymentOption.paymaster.requestPaymasterAndData(userOp)
      )
      userOp.setSignature(
        await senderAccount.sign(userOp.hash(entryPoint, network.chainId))
      )
      const userOpHash = await provider.send(
        WaalletRpcMethod.eth_sendUserOperation,
        [userOp.data(), entryPoint]
      )
      if (!userOpHash) {
        throw new Error("Fail to send user operation")
      }
      await markERC4337v06TransactionSent(pendingTx.id, {
        entryPoint,
        userOp,
        userOpHash
      })
    } catch (e) {
      // TOOD: Show error on page
      console.error(e)
      setUserOpResolving(false)
    }
  }

  const rejectUserOperation = async () => {
    setUserOpResolving(true)
    try {
      await markERC4337v06TransactionRejected(pendingTx.id, {
        entryPoint: await senderAccount.getEntryPoint(),
        userOp
      })
      navigate(Path.Index)
    } catch (e) {
      console.error(e)
      setUserOpResolving(false)
    }
  }

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

  const estimateGas = async (userOp: UserOperation) => {
    userOp.setPaymasterAndData(
      await paymentOption.paymaster.requestPaymasterAndData(userOp, true)
    )
    userOp.setGasFee(await estimateGasFee())
    userOp.setGasLimit(
      await provider.send(WaalletRpcMethod.eth_estimateUserOperationGas, [
        userOp.data(),
        await senderAccount.getEntryPoint()
      ])
    )
  }

  useEffect(() => {
    async function setupUserOp() {
      const userOp = await senderAccount.createUserOperation(pendingTx)
      await estimateGas(userOp)
      setUserOp(userOp)
    }
    if (!senderAccount) {
      return
    }
    setupUserOp()
  }, [senderAccount])

  useEffect(() => {
    async function estimateUserOp() {
      setUserOpEstimating(true)
      await estimateGas(userOp)
      setUserOp(userOp)
      setUserOpEstimating(false)
    }
    if (!userOp) {
      return
    }
    estimateUserOp()
  }, [paymentOption])

  useEffect(() => {
    async function calculatePayment() {
      setPaymentCalculating(true)
      setPayment({
        ...payment,
        tokenFee: await paymentOption.paymaster.quoteFee(
          userOp.calculateGasFee(),
          ETH
        )
      })
      setPaymentCalculating(false)
    }
    if (!userOp) {
      return
    }
    calculatePayment()
  }, [JSON.stringify(userOp?.data())])

  if (!senderAccount || !userOp) {
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
