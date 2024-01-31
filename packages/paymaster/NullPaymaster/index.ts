import type { Paymaster } from "~packages/paymaster"

export class NullPaymaster implements Paymaster {
  public async requestPayment() {
    return "0x"
  }
}
