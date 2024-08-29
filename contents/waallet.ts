import waalletIcon from "data-base64:~assets/waallet.svg"
import type { PlasmoCSConfig } from "plasmo"

import { announceProvider } from "~packages/eip/6939"
import { MainWorldBackgroundMessenger } from "~packages/messenger/background/mainWorld"
import { WaalletContentProvider } from "~packages/waallet/content/provider"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  run_at: "document_start"
}

console.log(
  "You may find that having is not so pleasing a thing as wanting. This is not logical, but it is often true."
)

const provider = new WaalletContentProvider(new MainWorldBackgroundMessenger())

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
window.dispatchEvent(new Event("ethereum#initialized"))

announceProvider(provider, {
  uuid: "53d360a5-d477-4b59-9975-151d3cac6d56",
  name: "Waallet",
  icon: waalletIcon,
  rdns: "io.waallet"
})
