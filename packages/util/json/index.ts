import JSONB from "json-bigint"

import number from "~packages/util/number"

export default JSONB({ useNativeBigInt: true })

export const replacer = {
  numberToHex: (_, v: any) => {
    if (["number", "bigint"].includes(typeof v)) {
      return number.toHex(v)
    }
    return v
  }
}
