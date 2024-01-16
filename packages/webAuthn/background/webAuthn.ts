import {
  runtime,
  tabs,
  windows,
  type Runtime,
  type Tabs,
  type Windows
} from "webextension-polyfill"

import json from "~packages/util/json"
import { PortName } from "~packages/webAuthn/tabs/port"
import {
  isWebAuthnError,
  type WebAuthnAuthentication,
  type WebAuthnCreation,
  type WebAuthnError,
  type WebAuthnParams,
  type WebAuthnRegistration,
  type WebAuthnRequest
} from "~packages/webAuthn/typing"

export const webAuthnCreationAsyncWindow = async (
  webAuthnCreation?: WebAuthnCreation
): Promise<WebAuthnRegistration> => {
  const createWindowUrl = `${runtime.getURL(
    "tabs/createWebAuthn.html"
  )}?user=${encodeURI(
    webAuthnCreation?.user
  )}&challengeCreation=${webAuthnCreation?.challenge}`

  return (await webAuthnWindowOrTabAsync(
    createWindowUrl,
    true
  )) as WebAuthnRegistration
}

export const webAuthnRequestAsyncWindow = async (
  webAuthnRequest: WebAuthnRequest
): Promise<WebAuthnAuthentication> => {
  const requestWebauthnUrl = `${runtime.getURL(
    "tabs/requestWebauthn.html"
  )}?credentialId=${webAuthnRequest.credentialId}&challengeRequest=${
    webAuthnRequest.challenge
  }`

  return (await webAuthnWindowOrTabAsync(
    requestWebauthnUrl,
    true
  )) as WebAuthnAuthentication
}

export const webAuthnAsyncWindow = async (
  tabId: number,
  { webAuthnCreation, webAuthnRequest }: WebAuthnParams
): Promise<WebAuthnRegistration | WebAuthnAuthentication> => {
  const webAuthnUrl = `${runtime.getURL(
    "tabs/webAuthn.html"
  )}?tabId=${tabId}&user=${encodeURI(
    webAuthnCreation?.user
  )}&challengeCreation=${webAuthnCreation?.challenge}&credentialId=${
    webAuthnRequest.credentialId
  }&challengeRequest=${webAuthnRequest.challenge}`

  return await webAuthnWindowOrTabAsync(webAuthnUrl, true)
}

export const webAuthnCreationAsyncTab = async (
  webAuthnCreation?: WebAuthnCreation
): Promise<WebAuthnRegistration> => {
  const createWindowUrl = `${runtime.getURL(
    "tabs/createWebAuthn.html"
  )}?user=${encodeURI(
    webAuthnCreation?.user
  )}&challengeCreation=${webAuthnCreation?.challenge}`

  return (await webAuthnWindowOrTabAsync(
    createWindowUrl,
    false
  )) as WebAuthnRegistration
}

export const webAuthnRequestAsyncTab = async (
  webAuthnRequest: WebAuthnRequest
): Promise<WebAuthnAuthentication> => {
  const requestWebauthnUrl = `${runtime.getURL(
    "tabs/requestWebauthn.html"
  )}?credentialId=${webAuthnRequest.credentialId}&challengeRequest=${
    webAuthnRequest.challenge
  }`

  return (await webAuthnWindowOrTabAsync(
    requestWebauthnUrl,
    false
  )) as WebAuthnAuthentication
}

export const webAuthnAsyncTab = async (
  tabId: number,
  { webAuthnCreation, webAuthnRequest }: WebAuthnParams
): Promise<WebAuthnRegistration | WebAuthnAuthentication> => {
  const webAuthnUrl = `${runtime.getURL(
    "tabs/webAuthn.html"
  )}?tabId=${tabId}&user=${encodeURI(
    webAuthnCreation?.user
  )}&challengeCreation=${webAuthnCreation?.challenge}&credentialId=${
    webAuthnRequest.credentialId
  }&challengeRequest=${webAuthnRequest.challenge}`

  return await webAuthnWindowOrTabAsync(webAuthnUrl, false)
}

const webAuthnWindowOrTabAsync = async (
  url: string,
  isWindow: boolean
): Promise<WebAuthnRegistration | WebAuthnAuthentication> => {
  let webAuthnRegistration: WebAuthnRegistration
  let webAuthnAuthentication: WebAuthnAuthentication
  let webAuthnError: WebAuthnError
  // Define a listener for port communication
  const portListener = (port: Runtime.Port) => {
    if (port.name === PortName.port_createWebAuthn) {
      // Listener for credential messages from the new window
      port.onMessage.addListener(
        (message: WebAuthnRegistration | WebAuthnError) => {
          if (isWebAuthnError(message)) {
            webAuthnRegistration = undefined
            webAuthnAuthentication = undefined
            webAuthnError = message
          } else {
            webAuthnRegistration = message as WebAuthnRegistration
            webAuthnAuthentication = undefined
            webAuthnError = undefined
            console.log(
              `[background][messaging][window] credential: ${json.stringify(
                webAuthnRegistration,
                null,
                2
              )}`
            )
            port.postMessage({ out: "got credential!" })
          }
        }
      )
    }
    if (port.name === PortName.port_requestWebAuthn) {
      // Listener for signature messages from the new window
      port.onMessage.addListener(
        (message: WebAuthnAuthentication | WebAuthnError) => {
          if (isWebAuthnError(message)) {
            webAuthnRegistration = undefined
            webAuthnAuthentication = undefined
            webAuthnError = message
          } else {
            webAuthnAuthentication = message as WebAuthnAuthentication
            webAuthnRegistration = undefined
            webAuthnError = undefined
            console.log(
              `[background][messaging][window] signature: ${json.stringify(
                webAuthnAuthentication,
                null,
                2
              )}`
            )
            port.postMessage({ out: "got signature!" })
          }
        }
      )
    }
    // Remove the port listener on disconnect
    port.onDisconnect.addListener(() => {
      runtime.onConnect.removeListener(portListener)
    })
  }

  // Return custom promise
  return new Promise(async (resolve, reject) => {
    try {
      // Create a new popup window or tab
      let createdWindowOrTab: Windows.Window | Tabs.Tab
      if (isWindow) {
        createdWindowOrTab = await windows.create({
          url: url,
          focused: true,
          type: "popup",
          width: 480,
          height: 720
        })
      } else {
        const newWindow = await windows.create({ type: "normal" })
        createdWindowOrTab = await tabs.create({
          windowId: newWindow.id,
          url: url,
          active: true
        })
      }

      // Define a listener for window or tab removal
      const removedListener = (removedWindowId: number) => {
        if (removedWindowId === createdWindowOrTab.id) {
          windows.onRemoved.removeListener(removedListener)
          if (webAuthnError) {
            reject(`${webAuthnError.error}`)
            return
          }
          if (webAuthnRegistration) {
            resolve(webAuthnRegistration)
            return
          }
          if (webAuthnAuthentication) {
            resolve(webAuthnAuthentication)
            return
          }
        }
      }
      // Add the window or tab removal listener
      windows.onRemoved.addListener(removedListener)

      // Add the port listener
      runtime.onConnect.addListener(portListener)
    } catch (e) {
      // Reject the Promise if an error occurs
      reject(e)
      return
    }
  })
}
