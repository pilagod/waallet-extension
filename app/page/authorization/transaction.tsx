import * as ethers from "ethers"
import { useEffect, useState } from "react"
import Gas from "react:~assets/gas"
import PassKey from "react:~assets/passkey"
import Wallet from "react:~assets/wallet"
import { useClsState } from "use-cls-state"
import { useHashLocation } from "wouter/use-hash-location"

import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import {
  useAccount,
  useAction,
  useNetwork,
  usePendingTransactions,
  useStorage
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
import number from "~packages/util/number"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import { AccountStorageManager } from "~storage/local/manager"
import {
  TransactionType,
  type Network,
  type TransactionPending
} from "~storage/local/state"

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
  // TODO: Select paymaster
  const paymentOption = paymentOptions[0]

  const {
    getERC4337TransactionType,
    markERC4337TransactionSent,
    markERC4337TransactionRejected
  } = useAction()

  /* Payment */

  const [payment, setPayment] = useState({
    token: ETH,
    tokenFee: 0n
  })
  const [paymentCalculating, setPaymentCalculating] = useState(false)

  /* User Operation */

  const [userOp, setUserOp] = useClsState<UserOperation>(null)
  const [userOpResolving, setUserOpResolving] = useState(false)
  const [userOpEstimating, setUserOpEstimating] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const { setToast } = useStorage()

  const sendUserOperation = async () => {
    setUserOpResolving(true)
    try {
      const entryPoint = await sender.getEntryPoint()

      userOp.setPaymasterAndData(
        await paymentOption.paymaster.requestPaymasterAndData(userOp)
      )

      // Sign user operation
      try {
        console.log("signing user operation...")
        setIsSigning(true)
        const signature = await sender.sign(
          userOp.hash(entryPoint, network.chainId)
        )
        userOp.setSignature(signature)
        setIsSigning(false)
      } catch (signErr) {
        setIsSigning(false)
        console.log("signErr", signErr)
        setToast("Verify passkey failed.", "failed")
      }

      const userOpHash = await provider.send(
        WaalletRpcMethod.eth_sendUserOperation,
        [userOp.unwrap(), entryPoint]
      )
      if (!userOpHash) {
        throw new Error("Fail to send user operation")
      }
      // TODO: Wrong nonce problem when confirming consecutive pending tx
      await markERC4337TransactionSent(tx.id, {
        entryPoint,
        userOp,
        userOpHash
      })
    } catch (e) {
      // TOOD: Show error on page
      console.error(e)
    } finally {
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
    } catch (e) {
      console.error(e)
    } finally {
      setUserOpResolving(false)
    }
  }

  const estimateGas = async (userOp: UserOperation) => {
    const paymasterAndData =
      await paymentOption.paymaster.requestPaymasterAndData(userOp, true)
    userOp.setPaymasterAndData(paymasterAndData)

    const gasFee = await provider.send(
      WaalletRpcMethod.custom_estimateGasPrice,
      []
    )
    userOp.setGasFee(gasFee)

    const gasLimit = await provider.send(
      WaalletRpcMethod.eth_estimateUserOperationGas,
      [userOp.unwrap(), await sender.getEntryPoint()]
    )
    userOp.setGasLimit(gasLimit)
  }

  useEffect(() => {
    async function setupUserOp() {
      setUserOp(null)
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
  }, [tx.id])

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
  }, [])

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
    return
  }

  if (isSigning) {
    return (
      <div className="w-full h-full flex flex-col gap-[43px] items-center justify-center">
        <PassKey />
        <span className="text-[24px] text-center">
          Use passkey to verify transaction
        </span>
      </div>
    )
  }

  return (
    <>
      <StepBackHeader title={"Send"} href={Path.Index}>
        <div className="text-[48px]">
          {number.formatUnitsToFixed(tx.value, 18, 4)} ETH
        </div>{" "}
      </StepBackHeader>
      <section className="py-[16px] text-[16px]">
        <h2 className="py-[12px]">From</h2>
        <div className="flex gap-[12px] items-center">
          <Wallet />
          <div className="w-[322px] py-[9.5px]">
            <h3>Jesse's wallet</h3>
            <h4 className="text-[#989898] break-words">{userOp.sender}</h4>
          </div>
        </div>
        <h2 className="py-[12px]">To</h2>
        <div className="flex gap-[12px] items-center">
          <Wallet />
          <div className="py-[16px] w-[322px]">
            <h3 className="break-words">{props.tx.to}</h3>
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
        </div>
      </section>

      <div className="py-[22.5px] flex justify-between gap-[16px] text-[18px] font-semibold">
        <Button
          disabled={userOpResolving}
          onClick={rejectUserOperation}
          text="Cancel"
          variant="white"
        />
        <Button
          disabled={paymentCalculating || userOpEstimating || userOpResolving}
          onClick={sendUserOperation}
          text="Confirm"
          variant="black"
        />
      </div>
    </>
  )
}
