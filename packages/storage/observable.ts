import structuredClone from "@ungap/structured-clone"
import { enablePatches, produceWithPatches, type Draft } from "immer"

import type { RecursivePartial } from "~typing"

enablePatches()

export enum ObservableStorageEvent {
  StateUpdated = "StateUpdated"
}

export class ObservableStorage<T extends Record<string, any>> {
  private subscribers: {
    handler: (state: T) => Promise<void>
    path?: (string | number)[]
  }[] = []

  public constructor(private state: T) {}

  public get(): T {
    return structuredClone(this.state)
  }

  public set(
    updates: RecursivePartial<T>,
    option: { override?: boolean } = {}
  ) {
    const [state] = produceWithPatches(this.state, (draft) => {
      if (option.override) {
        return { ...draft, ...updates }
      }
      this.applyUpdates(draft, updates)
    })
    this.state = structuredClone(state)
    // TODO: filter patches before emitting
    for (const s of this.subscribers) {
      s.handler(this.get())
    }
  }

  public subscribe(
    handler: (state: T) => Promise<void>,
    path?: (string | number)[]
  ) {
    this.subscribers.push({
      handler,
      path
    })
  }

  public unsubscribe(handler: (state: T) => Promise<void>) {
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
          draft[k] = {}
        }
        this.applyUpdates(draft[k], v)
      } else {
        draft[k] = v
      }
    })
  }
}
