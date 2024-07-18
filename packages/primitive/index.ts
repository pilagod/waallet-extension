export * from "./address"
export * from "./bytes"

export function unwrap(v: any) {
  if (v["unwrap"] instanceof Function) {
    return v.unwrap()
  }
  return v
}
