import JSONB from "json-bigint"

import number from "~packages/util/number"

const json = JSONB({ useNativeBigInt: true })

export default json

export const replacer = {
  numberToHex: (_: string, v: any) => {
    if (["number", "bigint"].includes(typeof v)) {
      return number.toHex(v)
    }
    return v
  },
  uint8ArrayToHexString: (_: string, v: any) => {
    if (v instanceof Uint8Array) {
      return Buffer.from(v).toString("hex")
    }
    return v
  }
}

export function format(
  data: any,
  customReplacer?: (this: any, key: string, value: any) => any
): string {
  return json.stringify(
    data,
    customReplacer
      ? (key: string, value: any) => {
          return replacer.uint8ArrayToHexString(key, customReplacer(key, value))
        }
      : replacer.uint8ArrayToHexString,
    2
  )
}
