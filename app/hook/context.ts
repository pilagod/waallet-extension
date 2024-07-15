import { useContext } from "react"

import { ProviderContext } from "~app/context/provider"

export const useProvider = () => {
  return useContext(ProviderContext)
}
