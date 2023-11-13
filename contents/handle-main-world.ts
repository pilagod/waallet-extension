import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"
import { relay } from "@plasmohq/messaging/relay"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

relay(
  {
    name: "window" as const
  },
  async (req) => {
    console.log(`[contents][relay] Request: ${JSON.stringify(req, null, 2)}`)
    const openResult = await sendToBackground(req as any)
    return openResult
  }
)
