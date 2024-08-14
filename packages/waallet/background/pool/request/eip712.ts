import { eip712Hash, type Eip712TypedData } from "~packages/eip/712"

export class Eip712Request {
  public constructor(public typedData: Eip712TypedData) {}

  public hash() {
    return eip712Hash(this.typedData)
  }
}
