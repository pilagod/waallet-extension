import structuredClone from "@ungap/structured-clone"
import {
  applyPatches,
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

  public set(updater: ObservableStorageUpdater<T>)
  public set(patches: Patch[])
  public set(updaterOrPatches: ObservableStorageUpdater<T> | Patch[]) {
    const { state, patches } = this.applyUpdates(updaterOrPatches)

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

  private applyUpdates(
    updaterOrPatches: ObservableStorageUpdater<T> | Patch[]
  ): {
    state: T
    patches: Patch[]
  } {
    if (typeof updaterOrPatches === "function") {
      const [state, patches] = produceWithPatches(this.state, updaterOrPatches)
      return { state, patches }
    }
    const state = applyPatches(this.state, updaterOrPatches)
    return { state, patches: updaterOrPatches }
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
