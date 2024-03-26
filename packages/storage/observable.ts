import { EventEmitter } from "events"
import structuredClone from "@ungap/structured-clone"

import type { RecursivePartial } from "~typing"

export enum ObservableStorageEvent {
  StateUpdated = "StateUpdated"
}

export class ObservableStorage<
  T extends Record<string, any>
> extends EventEmitter {
  public constructor(private state: T = {} as T) {
    super()
  }

  public get(): T {
    return structuredClone(this.state)
  }

  public set(
    updates: RecursivePartial<T>,
    option: { override?: boolean; broadcast?: boolean } = { broadcast: true }
  ) {
    if (option.override) {
      this.state = { ...this.get(), ...updates }
    } else {
      this.updatePartial(this.state, updates)
    }
    if (option.broadcast) {
      this.emit(ObservableStorageEvent.StateUpdated, this.get())
    }
  }

  public subscribe(handler: (state: T) => Promise<void>) {
    this.addListener(ObservableStorageEvent.StateUpdated, handler)
  }

  public unsubscribe(handler: (state: T) => Promise<void>) {
    this.removeListener(ObservableStorageEvent.StateUpdated, handler)
  }

  private updatePartial<O extends Record<string, any>>(
    target: O,
    updates: RecursivePartial<O>
  ) {
    for (const [key, value] of Object.entries(updates)) {
      if (value instanceof Object) {
        if (!target[key]) {
          target[key as keyof O] = {} as typeof value
        }
        this.updatePartial(target[key], value)
      } else {
        target[key as keyof O] = value
      }
    }
  }
}
