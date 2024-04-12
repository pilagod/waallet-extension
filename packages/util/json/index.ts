import JSONB from "json-bigint"

import number from "~packages/util/number"

export default JSONB({ useNativeBigInt: true })

export const replacer = {
  numberToHex: (_: string, v: any) => {
    if (["number", "bigint"].includes(typeof v)) {
      return number.toHex(v)
    }
    return v
  },
  uint8ArrayToHexString: (_: string, v: any) => {
    // Filtering out properties
    if (v instanceof Uint8Array) {
      return Buffer.from(v).toString("hex")
    }
    return v
  }
}

export function format(
  data: any,
  replacer: (this: any, key: string, value: any) => any | null = null
): string {
  const json = JSONB({ useNativeBigInt: true })
  return json.stringify(data, replacer, 2)
}
