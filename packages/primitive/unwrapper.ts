export type Unwrappable<T> = T | Unwrapper<T>
export type UnwrappableMap<T> = T extends unknown[]
  ? {
      [K in keyof T]: Unwrappable<T[K]>
    }
  : never
export type Unwrap<T> = T extends Unwrappable<infer S> ? S : T

export interface Unwrapper<T> {
  unwrap(): T
}

export function unwrap<T>(v: T | Unwrapper<T>): T {
  if (v["unwrap"] instanceof Function) {
    return (v as Unwrapper<T>).unwrap()
  }
  return v as T
}
