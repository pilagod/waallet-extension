import { ObservableStorage } from "./observable"

describe("ObservableStorage", () => {
  it("should get current state", () => {
    const s = new ObservableStorage({ a: 123, b: "abc", c: { d: null } })

    const state = s.get()

    expect(state.a).toBe(123)
    expect(state.b).toBe("abc")
    expect(state.c.d).toBe(null)
  })

  it("should set partial fields in state", () => {
    const s = new ObservableStorage({
      a: 123,
      b: "abc",
      c: [1, 2, 3],
      d: { e: null, f: "xyz" }
    })

    s.set({
      a: 456,
      b: "def",
      c: [4, 5, 6],
      d: { e: 999 }
    })

    const state = s.get()

    expect(state.a).toBe(456)
    expect(state.b).toBe("def")
    expect(state.c).toEqual([4, 5, 6])
    expect(state.d.e).toBe(999)
    expect(state.d.f).toBe("xyz")
  })

  it("should set partial fields in state by updater", () => {
    const s = new ObservableStorage({
      a: 123,
      b: "abc",
      c: [1, 2, 3],
      d: { e: null, f: "xyz" }
    })

    s.set((draft) => {
      draft.a = 456
      draft.b = "def"
      draft.c.splice(0, 3, 4, 5, 6)
      draft.d.e = 999
    })

    const state = s.get()

    expect(state.a).toBe(456)
    expect(state.b).toBe("def")
    expect(state.c).toEqual([4, 5, 6])
    expect(state.d.e).toBe(999)
    expect(state.d.f).toBe("xyz")
  })

  it("should set and override fields in state", () => {
    const s = new ObservableStorage<Record<string, any>>({
      a: { b: 123 }
    })

    s.set(
      {
        a: { c: 999 }
      },
      { override: true }
    )

    const state = s.get()

    expect(state.a.b).toBeUndefined()
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

  it("should be able to subscribe to certain path", () => {
    const s = new ObservableStorage({ a: { b: { c: 123 } } })

    // Exactly match
    let s1: ReturnType<(typeof s)["get"]>
    s.subscribe(
      async (state) => {
        s1 = state
      },
      ["a", "b", "c"]
    )

    // Partially match
    let s2: ReturnType<(typeof s)["get"]>
    s.subscribe(
      async (state) => {
        s2 = state
      },
      ["a", "b"]
    )

    // Not matched
    let s3: ReturnType<(typeof s)["get"]>
    s.subscribe(
      async (state) => {
        s3 = state
      },
      ["a", "b", "d"]
    )

    s.set({ a: { b: { c: 999 } } })

    expect(s1.a.b.c).toBe(999)
    expect(s2.a.b.c).toBe(999)
    expect(s3).toBeUndefined()
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
