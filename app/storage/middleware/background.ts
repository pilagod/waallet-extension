import { produceWithPatches, type Draft, type Patch } from "immer"
import {
  type Mutate,
  type StateCreator,
  type StoreApi,
  type StoreMutatorIdentifier
} from "zustand"

type Write<T, U> = Omit<T, keyof U> & U
type SkipTwo<T> = T extends { length: 0 }
  ? []
  : T extends { length: 1 }
  ? []
  : T extends { length: 0 | 1 }
  ? []
  : T extends [unknown, unknown, ...infer A]
  ? A
  : T extends [unknown, unknown?, ...infer A]
  ? A
  : T extends [unknown?, unknown?, ...infer A]
  ? A
  : never

interface BackgroundStorage<T> {
  set: (patches: Patch[]) => Promise<void>
  sync: (get: StoreApi<T>["getState"], set: StoreApi<T>["setState"]) => void
}

type Background = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [...Mps, ["background", never]], Mcs>,
  storage: BackgroundStorage<T>
) => StateCreator<T, Mps, [["background", never], ...Mcs]>

declare module "zustand" {
  interface StoreMutators<S, A> {
    background: Write<S, StoreBackground<S>>
  }
}

type StoreBackground<S> = S extends {
  getState: () => infer T
  setState: infer SetState
}
  ? SetState extends (...a: infer A) => infer Sr
    ? {
        setState(
          nextStateOrUpdater: T | Partial<T> | ((state: Draft<T>) => void),
          shouldReplace?: boolean | undefined,
          ...a: SkipTwo<A>
        ): Promise<Sr>
        setStateLocally: SetState
      }
    : never
  : never

type BackgrounImpl = <T>(
  initializer: StateCreator<T, [], []>,
  storage: BackgroundStorage<T>
) => StateCreator<T, [], []>

const backgroundImpl: BackgrounImpl = (initializer, storage) => {
  return (set, get, _store) => {
    type T = ReturnType<typeof initializer>

    const store = _store as Mutate<StoreApi<T>, [["background", never]]>

    store.setState = async (updaterOrUpdates) => {
      const updater = (
        typeof updaterOrUpdates === "function"
          ? updaterOrUpdates
          : (draft: Draft<T>) => {
              return {
                ...draft,
                ...updater
              }
            }
      ) as (state: Draft<T>) => Draft<T> | void

      const [_, patches] = produceWithPatches(get(), updater)
      await storage.set(patches)
    }
    store.setStateLocally = (state: T) => {
      set(state)
    }
    storage.sync(get, set)

    return initializer(_store.setState, get, _store)
  }
}

export const background = backgroundImpl as unknown as Background
