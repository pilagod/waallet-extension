import type { PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

const channelToMainWorld = new BroadcastChannel("MainWorld")
const channelToContentScript = new BroadcastChannel("ContentScript")

channelToContentScript.addEventListener(
  "message",
  async (e: MessageEvent<{ messageId: string; name: string; body: any }>) => {
    const request = e.data
    console.log(`[content][relay][${request.name}][request]`, request)
    const data = await sendToBackground(request as any)
    const response = {
      messageId: request.messageId,
      name: request.name,
      body: data
    }
    console.log(`[content][relay][${request.name}][response]`, response)
    channelToMainWorld.postMessage(response)
  }
)
