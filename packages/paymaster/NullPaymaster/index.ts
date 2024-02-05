import type { Paymaster } from "~packages/paymaster"

export class NullPaymaster implements Paymaster {
  public async requestPaymasterAndData() {
    return "0x"
  }
}
