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
 *   (1) Execute Provider's createWindow():
 *
 *     await (window as any).waallet.createWindow({
 *       sourceMethod: "eth_someCreationWindowMethod",
 *       post: "createWindow",
 *       params: { hello: "world" },
 *     });
 *
 *   (2) Bypass the Provider and directly window.postMessage() to Contents:
 *
 *     window.postMessage(
 *       {
 *         sourceMethod: "eth_someCreationWindowMethod",
 *         post: "createWindow",
 *         params: { hello: "world" },
 *       },
 *       window.location.origin
 *     );
 */
const callback = async (
  messageEvent: MessageEvent<{
    sourceMethod: string
    post: string
    params: any
  }>
) => {
  if (messageEvent.data.sourceMethod !== "eth_someCreationWindowMethod") {
    return
  }
  if (messageEvent.data.post !== "createWindow") {
    return
  }
  console.log(
    `[contents][listener][createWindow] Message: ${JSON.stringify(
      messageEvent.data,
      null,
      2
    )}`
  )

  const res = await sendToBackgroundViaRelay({
    name: "mCreateWindow" as keyof MessagesMetadata, // Defined by the background/messages/mCreateWindow.ts filename
    body: { in: `Please create the window.` }
  })
  console.log(
    `[contents][sendToBackgroundViaRelay] Response: ${JSON.stringify(
      res,
      null,
      2
    )}`
  )
}

// Listen from window.postMessage()
window.addEventListener("message", callback)
;(window as any).waallet = new WaalletProvider("", "")
