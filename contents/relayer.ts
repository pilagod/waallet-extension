import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"
import { relay } from "@plasmohq/messaging/relay"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

relay(
  {
    name: "mCreateWindow" as const // Defined by the background/messages/mCreateWindow.ts filename
  },
  async (req) => {
    console.log(`[contents][relay] Request: ${JSON.stringify(req, null, 2)}`)
    const openResult = await sendToBackground(req as any)
    return openResult
  }
)
