import type { PlasmoCSConfig } from "plasmo"

import {
  sendToBackgroundViaRelay,
  type MessagesMetadata
} from "@plasmohq/messaging"

import { WaalletProvider } from "~packages/provider/waallet"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  run_at: "document_start"
}

console.log(
  "You may find that having is not so pleasing a thing as wanting. This is not logical, but it is often true."
)

/**
 * Usage in the DApp:
 *
 * await (window as any).waallet.request({
 *  method: "eth_waalletConnect",
 *  params: { post: "post:window" },
 *   });
 */
const callback = async (
  messageEvent: MessageEvent<{
    method: string
    params: { post: string }
  }>
) => {
  if (messageEvent.data.method !== "eth_waalletConnect") {
    return
  }
  if (messageEvent.data.params.post === "post:window") {
    console.log(
      `[contents][listener][post:window] Message: ${JSON.stringify(
        messageEvent,
        null,
        2
      )}`
    )

    const res = await sendToBackgroundViaRelay({
      name: "window" as keyof MessagesMetadata,
      body: { in: `Please open the connecting window.` }
    })
    console.log(
      `[contents][sendToBackgroundViaRelay] Response: ${JSON.stringify(
        res,
        null,
        2
      )}`
    )
  }
}

// Listen from postMessage()
window.addEventListener("message", callback)
;(window as any).waallet = new WaalletProvider("", "")
