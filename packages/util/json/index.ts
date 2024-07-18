import JSONB from "json-bigint"

import { unwrap } from "~packages/primitive"
import number from "~packages/util/number"

const json = JSONB({ useNativeBigInt: true })

export default json

export type Replacer = (k: string, v: any) => any

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
  },

  unwrap: (_: string, v: any) => {
    return unwrap(v)
  },

  pipe: (k: string, v: any, rps: Replacer[]) => {
    return rps.reduce((v, r) => {
      return r(k, v)
    }, v)
  }
}

export function format(data: any, rp: Replacer = (_, v) => v): string {
  return json.stringify(
    data,
    (k, v) => {
      return replacer.pipe(k, v, [rp, replacer.uint8ArrayToHexString])
    },
    2
  )
}
