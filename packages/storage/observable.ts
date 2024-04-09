import { EventEmitter } from "events"
import structuredClone from "@ungap/structured-clone"
import { enablePatches, produceWithPatches, type Draft } from "immer"

import type { RecursivePartial } from "~typing"

enablePatches()

export enum ObservableStorageEvent {
  StateUpdated = "StateUpdated"
}

export class ObservableStorage<
  T extends Record<string, any>
> extends EventEmitter {
  public constructor(private state: T) {
    super()
  }

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
    this.emit(ObservableStorageEvent.StateUpdated, this.get())
  }

  public subscribe(handler: (state: T) => Promise<void>) {
    this.addListener(ObservableStorageEvent.StateUpdated, handler)
  }

  public unsubscribe(handler: (state: T) => Promise<void>) {
    this.removeListener(ObservableStorageEvent.StateUpdated, handler)
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
