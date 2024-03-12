import { ObservableStorage } from "./observable"

describe("ObservableStorage", () => {
  it("should get current state", () => {
    const s = new ObservableStorage({ a: 123, b: "abc", c: { d: null } })

    const state = s.get()

    expect(Object.keys(state)).toHaveLength(3)
    expect(state.a).toBe(123)
    expect(state.b).toBe("abc")

    expect(Object.keys(state.c)).toHaveLength(1)
    expect(state.c.d).toBe(null)
  })

  it("should set specific fields in state", () => {
    const s = new ObservableStorage({
      a: 123,
      b: "abc",
      c: { d: 789, e: "xyz" }
    })

    s.set({ a: 111, c: { d: 999 } })

    const state = s.get()
    expect(state.a).toBe(111)
    expect(state.b).toBe("abc")
    expect(state.c.d).toBe(999)
    expect(state.c.e).toBe("xyz")
  })

  it("should not manipulate storage state through state returned from getter", () => {
    const s = new ObservableStorage({ a: 123 })

    s.get().a = 456

    const state = s.get()
    expect(state.a).toBe(123)
  })

  it("should be able to subscribe to state update", () => {
    const s = new ObservableStorage({ a: 123 })

    let stateSubscribed: ReturnType<(typeof s)["get"]>
    s.subscribe(async (state) => {
      stateSubscribed = state
    })

    s.set({ a: 456 })

    expect(stateSubscribed.a).toBe(456)
  })

  it("should be able to unsubscribe to state update", () => {
    const s = new ObservableStorage({ a: 123 })

    let isHandlerCalled = false
    const handler = async () => {
      isHandlerCalled = true
    }

    s.subscribe(handler)
    s.unsubscribe(handler)

    s.set({ a: 456 })

    expect(isHandlerCalled).toBe(false)
  })
})
