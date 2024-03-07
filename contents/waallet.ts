import waalletIcon from "data-base64:~assets/waallet.svg"
import type { PlasmoCSConfig } from "plasmo"

import { BackgroundRelayMessenger } from "~packages/messenger/background/relay"
import { WaalletContentProvider } from "~packages/waallet/content/provider"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  run_at: "document_start"
}

console.log(
  "You may find that having is not so pleasing a thing as wanting. This is not logical, but it is often true."
)

const provider = new WaalletContentProvider(new BackgroundRelayMessenger())

window["waallet"] = provider

Object.defineProperty(window, "ethereum", {
  configurable: false,
  enumerable: true,
  set(value) {
    console.log(value)
  },
  get() {
    return provider
  }
})

const announceEip6963Provider = (provider) => {
  const info = {
    uuid: "53d360a5-d477-4b59-9975-151d3cac6d56",
    name: "Waallet",
    icon: waalletIcon,
    rdns: "io.waallet"
  }

  window.dispatchEvent(
    new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze({ info, provider })
    })
  )
}

window.addEventListener<any>("eip6963:requestProvider", (event) => {
  announceEip6963Provider(provider)
})

window.addEventListener<any>("eip6963:announceProvider", (event) => {
  console.log(event)
})

announceEip6963Provider(provider)

window.dispatchEvent(new Event("ethereum#initialized"))
