import { useEffect, useState } from "react"
import { useClsState } from "use-cls-state"
import { useHashLocation } from "wouter/use-hash-location"

import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import { useAction } from "~app/storage"
import type { Account } from "~packages/account"
import {
  UserOperationV0_6,
  UserOperationV0_7,
  type UserOperation
} from "~packages/bundler/userOperation"
import { WaalletRpcMethod } from "~packages/waallet/rpc"
import {
  TransactionType,
  type Network,
  type TransactionPending
} from "~storage/local/state"

import type { PaymentOption } from "./transaction"

export function useUserOperation(props: {
  tx: TransactionPending
  sender: Account
  network: Network
  paymentOption: PaymentOption
}) {
  const { tx, sender, network, paymentOption } = props

  const [userOp, setUserOp] = useClsState<UserOperation>(null)
  const [userOpResolving, setUserOpResolving] = useState(false)
  const [userOpEstimating, setUserOpEstimating] = useState(false)

  const [, navigate] = useHashLocation()
  const { provider } = useProviderContext()

  const {
    getERC4337TransactionType,
    markERC4337TransactionSent,
    markERC4337TransactionRejected
  } = useAction()

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

  return {
    userOp,
    userOpResolving,
    sendUserOperation,
    rejectUserOperation,
    userOpEstimating
  }
}
