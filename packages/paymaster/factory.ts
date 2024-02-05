import { PaymasterType, type Paymaster, type Payment } from "./index"
import { NullPaymaster } from "./NullPaymaster"

export function createPaymaster(payment: Payment): Paymaster {
  switch (payment.paymasterType) {
    case PaymasterType.Null:
      return new NullPaymaster()
    default:
      throw new Error("Unknown paymaster type")
  }
}
