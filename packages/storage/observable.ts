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

  public set(updater: ObservableStorageUpdater<T>) {
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

  /**
   * @param pathStruct Depth-first search the struct for only the first path found. Please avoid multiple fields in one layer, it may not work expectedly.
   */
  public subscribe(
    handler: (state: T, patches: Patch[]) => Promise<void>,
    pathStruct?: RecursivePartial<T>
  ) {
    this.subscribers.push({ handler, path: this.derivePath(pathStruct) })
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

  private derivePath(pathStruct?: RecursivePartial<T>) {
    const result: (string | number)[] = []
    let struct: object = pathStruct ?? []
    while (Object.keys(struct).length > 0) {
      const keys = Object.keys(struct)
      result.push(keys[0])
      struct = struct[keys[0]]
    }
    return result
  }
}
