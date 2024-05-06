import structuredClone from "@ungap/structured-clone"
import {
  enablePatches,
  produceWithPatches,
  type Draft,
  type Patch
} from "immer"

import type { RecursivePartial } from "~typing"

enablePatches()

type ObservableStorageUpdater<T> = (draft: Draft<T>) => Draft<T> | void

export class ObservableStorage<T extends Record<string, any>> {
  private subscribers: {
    handler: (state: T, patches: Patch[]) => Promise<void>
    path?: (string | number)[]
  }[] = []

  public constructor(private state: T) {}

  public get(): T {
    return structuredClone(this.state)
  }

  public set(updater: ObservableStorageUpdater<T>): void
  public set(
    updates: RecursivePartial<T>,
    option?: { override?: boolean }
  ): void
  public set(
    updaterOrUpdates: ObservableStorageUpdater<T> | RecursivePartial<T>,
    option: { override?: boolean } = {}
  ) {
    const updater =
      typeof updaterOrUpdates === "function"
        ? updaterOrUpdates
        : (draft: Draft<T>) => {
            if (option.override) {
              return { ...draft, ...updaterOrUpdates }
            }
            this.applyUpdates(draft, updaterOrUpdates)
          }
    const [state, patches] = produceWithPatches(this.state, updater)

    this.state = structuredClone(state)

    const stateFreezed = Object.freeze(state)

    for (const s of this.subscribers) {
      const path = s.path ?? []
      const shouldNotify = patches.reduce(
        (result, patch) =>
          result ||
          path.reduce(
            (result, field, i) => result && patch.path[i] === field,
            true
          ),
        false
      )
      if (shouldNotify) {
        s.handler(stateFreezed, patches)
      }
    }
  }

  public subscribe(
    handler: (state: T, patches: Patch[]) => Promise<void>,
    path?: (string | number)[]
  ) {
    this.subscribers.push({ handler, path })
  }

  public unsubscribe(handler: (state: T, pathces: Patch[]) => Promise<void>) {
    for (let i = 0; i < this.subscribers.length; i++) {
      if (handler === this.subscribers[i].handler) {
        this.subscribers.splice(i, 1)
        break
      }
    }
  }

  private applyUpdates(draft: Draft<T>, updates: RecursivePartial<T>) {
    Object.entries(updates).forEach(([k, v]) => {
      if (v instanceof Object) {
        if (!draft[k]) {
          draft[k as keyof Draft<T>] = {} as typeof v
        }
        this.applyUpdates(draft[k], v)
      } else {
        draft[k as keyof Draft<T>] = v
      }
    })
  }
}
