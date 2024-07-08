import { useEffect, useState } from "react"

import type { UserOperation } from "~packages/bundler/userOperation"
import { ETH } from "~packages/token"

import type { PaymentOption } from "./transaction"

export function usePayment(prop: {
  userOp: UserOperation
  paymentOption: PaymentOption
}) {
  const { userOp, paymentOption } = prop
  const [payment, setPayment] = useState({
    token: ETH,
    tokenFee: 0n
  })
  const [paymentCalculating, setPaymentCalculating] = useState(false)

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

  return { payment, paymentCalculating }
}
