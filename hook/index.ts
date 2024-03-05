import "reflect-metadata"

import { instanceToPlain, plainToClassFromExist } from "class-transformer"
import { useRef, useState } from "react"

function isClassInstance(value: any): value is Object {
  return value instanceof Object && value.constructor !== Object
}

export function useClassState<S>(initialState: S): [S, (state: S) => void] {
  const [internalState, setInternalState] = useState(
    instanceToPlain(initialState)
  )
  const stateClassRef = useRef(
    isClassInstance(initialState) ? initialState.constructor : null
  )
  function setState(state: S) {
    stateClassRef.current = isClassInstance(state) ? state.constructor : null
    setInternalState(instanceToPlain(state))
  }
  if (!stateClassRef.current) {
    return [internalState as S, setState]
  }
  const state = Reflect.construct(Object, [], stateClassRef.current)
  return [plainToClassFromExist(state, internalState) as S, setState]
}
