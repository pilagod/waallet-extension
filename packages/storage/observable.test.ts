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
      c: { d: null, e: "xyz" }
    })

    s.set({ a: 111, c: { d: { f: 999 } } })

    const state = s.get()
    expect(state.a).toBe(111)
    expect(state.b).toBe("abc")
    expect(state.c.d.f).toBe(999)
    expect(state.c.e).toBe("xyz")
  })

  it("should override fields in state", () => {
    const s = new ObservableStorage({
      a: { b: 123 } as Record<string, any>
    })

    s.set(
      {
        a: { c: 999 }
      },
      { override: true }
    )

    const state = s.get()
    expect(state.a.b).toBe(undefined)
    expect(state.a.c).toBe(999)
  })

  it("should not manipulate storage state through state returned from getter", () => {
    const s = new ObservableStorage({ a: 123, b: { c: 123 } })

    const state = s.get()
    state.a = 111
    state.b.c = 999

    const stateInStorage = s.get()
    expect(stateInStorage.a).toBe(123)
    expect(stateInStorage.b.c).toBe(123)
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

  it("should not notify subscribers when broadcast option is diabled", () => {
    const s = new ObservableStorage({ a: 123 })

    let handlerCalled = false
    s.subscribe(async (state) => {
      handlerCalled = true
    })

    s.set({ a: 456 }, { broadcast: false })

    expect(handlerCalled).toBe(false)
  })

  it("should be able to unsubscribe to state update", () => {
    const s = new ObservableStorage({ a: 123 })

    let handlerCalled = false
    const handler = async () => {
      handlerCalled = true
    }
    s.subscribe(handler)
    s.unsubscribe(handler)

    s.set({ a: 456 })

    expect(handlerCalled).toBe(false)
  })
})
