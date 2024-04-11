import JSONB from "json-bigint"

import number from "~packages/util/number"

export default JSONB({ useNativeBigInt: true })

export const replacer = {
  numberToHex: (_: string, v: any) => {
    if (["number", "bigint"].includes(typeof v)) {
      return number.toHex(v)
    }
    return v
  }
}

export function stringify2(
  data: any,
  replacer: (this: any, key: string, value: any) => any | null = null
): string {
  const json = JSONB({ useNativeBigInt: true })
  return json.stringify(data, replacer, 2)
}
