export type Unwrappable<T> = T | Unwrapper<T>
export type Unwraplify<T> = T extends object
  ? {
      [K in keyof T]: Unwraplify<T[K]>
    }
  : Unwrappable<T>
export type Unwrap<T> = T extends Unwrappable<infer S> ? S : T

export interface Unwrapper<T> {
  unwrap(): T
}

export function unwrap<T>(v: Unwrappable<T>): T {
  if (v["unwrap"] instanceof Function) {
    return (v as Unwrapper<T>).unwrap()
  }
  return v as T
}

export function unwrapDeep<T>(v: Unwraplify<T>): T {
  if (v["unwrap"] instanceof Function) {
    return (v as Unwrapper<T>).unwrap()
  }
  if (Array.isArray(v)) {
    return v.map(unwrapDeep) as T
  }
  if (v["constructor"] === Object) {
    return Object.keys(v).reduce((r, k) => {
      r[k] = unwrap(v[k])
      return r
    }, {} as T)
  }
  return v as T
}
