import { eip712Hash, type Eip712TypedData } from "~packages/eip/712"

export class Eip712Request {
  public typedData: Eip712TypedData

  public constructor(typedData: Eip712TypedData | string) {
    this.typedData =
      typeof typedData === "string" ? JSON.parse(typedData) : typedData
  }

  public hash() {
    return eip712Hash(this.typedData)
  }
}
