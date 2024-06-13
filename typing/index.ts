export type B64UrlString = string
export type BytesLike = HexString | Uint8Array
export type BigNumberish = string | number | bigint
export type HexString = string
export type Nullable<T> = T | null
export type OptionalPick<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P]
}
export type RequiredPick<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>
