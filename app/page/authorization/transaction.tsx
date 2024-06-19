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
import {
  UserOperationV0_6,
  UserOperationV0_7,
  type UserOperation
} from "~packages/bundler/userOperation"
import type { Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { ETH } from "~packages/token"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import { AccountStorageManager } from "~storage/local/manager"
import {
  TransactionType,
  type Network,
  type TransactionPending
} from "~storage/local/state"

type PaymentOption = {
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
  const { tx, sender, network } = props

  const [, navigate] = useHashLocation()
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
  const {
    getERC4337TransactionType,
    markERC4337TransactionSent,
    markERC4337TransactionRejected
  } = useAction()

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
      const entryPoint = await sender.getEntryPoint()

      userOp.setPaymasterAndData(
        await paymentOption.paymaster.requestPaymasterAndData(userOp)
      )
      userOp.setSignature(
        await sender.sign(userOp.hash(entryPoint, network.chainId))
      )
      const userOpHash = await provider.send(
        WaalletRpcMethod.eth_sendUserOperation,
        [userOp.unwrap(), entryPoint]
      )
      if (!userOpHash) {
        throw new Error("Fail to send user operation")
      }
      await markERC4337TransactionSent(tx.id, {
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
      await markERC4337TransactionRejected(tx.id, {
        entryPoint: await sender.getEntryPoint(),
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
    const maxFeePerGasBuffer = (fee.gasPrice * 120n) / 100n
    const maxPriorityFeePerGasBuffer = (fee.gasPrice * 120n) / 100n
    return {
      maxFeePerGas: maxFeePerGasBuffer,
      maxPriorityFeePerGas: maxPriorityFeePerGasBuffer
    }
  }

  const estimateGas = async (userOp: UserOperation) => {
    userOp.setPaymasterAndData(
      await paymentOption.paymaster.requestPaymasterAndData(userOp, true)
    )
    userOp.setGasFee(await estimateGasFee())
    userOp.setGasLimit(
      await provider.send(WaalletRpcMethod.eth_estimateUserOperationGas, [
        userOp.unwrap(),
        await sender.getEntryPoint()
      ])
    )
  }

  useEffect(() => {
    async function setupUserOp() {
      const transactionType = getERC4337TransactionType(
        tx.networkId,
        await sender.getEntryPoint()
      )
      const execution = await sender.buildExecution(tx)
      const userOp =
        transactionType === TransactionType.ERC4337V0_6
          ? UserOperationV0_6.wrap(execution)
          : UserOperationV0_7.wrap(execution)
      await estimateGas(userOp)
      setUserOp(userOp)
    }
    setupUserOp()
  }, [])

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
  }, [JSON.stringify(userOp?.unwrap())])

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
