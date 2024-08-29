import type { Eip1193Provider } from "~packages/eip/1193"

export function announceProvider(
  provider: Eip1193Provider,
  info: {
    uuid: string
    name: string
    icon: string
    rdns: string
  }
) {
  window.addEventListener("eip6963:announceProvider", (event) => {
    console.log("[eip6963][announceProvider]", event)
  })
  window.addEventListener("eip6963:requestProvider", () => {
    announceProvider(provider, info)
  })
  window.dispatchEvent(
    new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze({ info, provider })
    })
  )
}
