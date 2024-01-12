import { runtime, tabs, windows, type Runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"
import json from "~packages/util/json"
import {
  isWebAuthnError,
  type WebAuthnAuthentication,
  type WebAuthnError,
  type WebAuthnRegistration
} from "~packages/webauthn/typing"

/**
 * Asynchronously creates a new window and sets up listeners for port communication.
 * @param {string} createWindowUrl - The URL for creating the new window.
 * @returns {Promise<chrome.windows.Window>} A Promise that resolves to the created window.
 */
export const webAuthnWindowAsync = async (
  createWindowUrl: string
): Promise<WebAuthnRegistration | WebAuthnAuthentication> => {
  return new Promise(async (resolve, reject) => {
    let webAuthnRegistration: WebAuthnRegistration
    let webAuthnAuthentication: WebAuthnAuthentication
    let webAuthnError: WebAuthnError
    try {
      // Create a new popup window
      const createdWindow = await windows.create({
        url: createWindowUrl,
        focused: true,
        type: "popup",
        width: 480,
        height: 720
      })

      // Define a listener for window removal
      const removedListener = (removedWindowId: number) => {
        if (removedWindowId === createdWindow.id) {
          windows.onRemoved.removeListener(removedListener)
          if (webAuthnError) {
            reject(`${webAuthnError.error}`)
          }
          if (webAuthnRegistration) {
            resolve(webAuthnRegistration)
          }
          if (webAuthnAuthentication) {
            resolve(webAuthnAuthentication)
          }
        }
      }
      // Add the window removal listener
      windows.onRemoved.addListener(removedListener)

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
                  `[background][messaging][window] credential: ${json.toString(
                    webAuthnRegistration
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
                  `[background][messaging][window] signature: ${json.toString(
                    webAuthnAuthentication
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
      // Add the port listener
      runtime.onConnect.addListener(portListener)
    } catch (e) {
      // Reject the Promise if an error occurs
      reject(e)
      return
    }
  })
}

/**
 * Asynchronously creates a new tab and sets up listeners for port communication.
 * @param {string} createTabUrl - The URL for creating the new tab.
 * @returns {Promise<chrome.tabs.Tab>} A Promise that resolves to the created tab.
 */
export const webAuthnTabAsync = async (
  createTabUrl: string
): Promise<WebAuthnRegistration | WebAuthnAuthentication> => {
  return new Promise(async (resolve, reject) => {
    let webAuthnRegistration: WebAuthnRegistration
    let webAuthnAuthentication: WebAuthnAuthentication
    let webAuthnError: WebAuthnError
    try {
      // Create a new inactive tab
      const createdTab = await tabs.create({
        url: createTabUrl,
        active: false
      })
      // Define a listener for tab removal
      const removedListener = (removedTabId: number) => {
        if (removedTabId === createdTab.id) {
          tabs.onRemoved.removeListener(removedListener)
          if (webAuthnError) {
            reject(`${webAuthnError.error}`)
          }
          if (webAuthnRegistration) {
            resolve(webAuthnRegistration)
          }
          if (webAuthnAuthentication) {
            resolve(webAuthnAuthentication)
          }
        }
      }
      // Add the tab removal listener
      tabs.onRemoved.addListener(removedListener)

      // Define a listener for port communication
      const portListener = (port: Runtime.Port) => {
        if (port.name === PortName.port_createWebAuthn) {
          // Listener for credential messages from the new tab
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
                  `[background][messaging][tab] credential: ${json.toString(
                    webAuthnRegistration
                  )}`
                )
                port.postMessage({ out: "got credential!" })
              }
            }
          )
        }
        if (port.name === PortName.port_requestWebAuthn) {
          // Listener for signature messages from the new tab
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
                  `[background][messaging][tab] signature: ${json.toString(
                    webAuthnAuthentication
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
      // Add the port listener
      runtime.onConnect.addListener(portListener)
    } catch (e) {
      // Reject the Promise if an error occurs
      reject(e)
      return
    }
  })
}
