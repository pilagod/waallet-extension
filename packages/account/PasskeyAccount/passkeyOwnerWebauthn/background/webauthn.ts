import { runtime, tabs, windows, type Runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"
import {
  isWebauthnError,
  type WebauthnAuthentication,
  type WebauthnError,
  type WebauthnRegistration
} from "~packages/webauthn/typing"

/**
 * Asynchronously creates a new window and sets up listeners for port communication.
 * @param {string} createWindowUrl - The URL for creating the new window.
 * @returns {Promise<chrome.windows.Window>} A Promise that resolves to the created window.
 */
export const webauthnWindowAsync = async (
  createWindowUrl: string
): Promise<WebauthnRegistration | WebauthnAuthentication> => {
  return new Promise(async (resolve, reject) => {
    let webauthnRegistration: WebauthnRegistration
    let webauthnAuthentication: WebauthnAuthentication
    let webauthnError: WebauthnError
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
          if (webauthnError) {
            reject(`${webauthnError.error}`)
          }
          if (webauthnRegistration) {
            resolve(webauthnRegistration)
          }
          if (webauthnAuthentication) {
            resolve(webauthnAuthentication)
          }
        }
      }
      // Add the window removal listener
      windows.onRemoved.addListener(removedListener)

      // Define a listener for port communication
      const portListener = (port: Runtime.Port) => {
        if (port.name === PortName.port_createWebauthn) {
          // Listener for credential messages from the new window
          port.onMessage.addListener(
            (message: WebauthnRegistration | WebauthnError) => {
              if (isWebauthnError(message)) {
                webauthnRegistration = undefined
                webauthnAuthentication = undefined
                webauthnError = message
              } else {
                webauthnRegistration = message as WebauthnRegistration
                webauthnAuthentication = undefined
                webauthnError = undefined
                console.log(
                  `[background][messaging][window] credential: ${JSON.stringify(
                    webauthnRegistration,
                    (_, value) => {
                      return typeof value === "bigint"
                        ? value.toString()
                        : value
                    },
                    2
                  )}`
                )
                port.postMessage({ out: "got credential!" })
              }
            }
          )
        }
        if (port.name === PortName.port_requestWebauthn) {
          // Listener for signature messages from the new window
          port.onMessage.addListener(
            (message: WebauthnAuthentication | WebauthnError) => {
              if (isWebauthnError(message)) {
                webauthnRegistration = undefined
                webauthnAuthentication = undefined
                webauthnError = message
              } else {
                webauthnAuthentication = message as WebauthnAuthentication
                webauthnRegistration = undefined
                webauthnError = undefined
                console.log(
                  `[background][messaging][window] signature: ${JSON.stringify(
                    webauthnAuthentication,
                    (_, value) => {
                      return typeof value === "bigint"
                        ? value.toString()
                        : value
                    },
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
export const webauthnTabAsync = async (
  createTabUrl: string
): Promise<WebauthnRegistration | WebauthnAuthentication> => {
  return new Promise(async (resolve, reject) => {
    let webauthnRegistration: WebauthnRegistration
    let webauthnAuthentication: WebauthnAuthentication
    let webauthnError: WebauthnError
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
          if (webauthnError) {
            reject(`${webauthnError.error}`)
          }
          if (webauthnRegistration) {
            resolve(webauthnRegistration)
          }
          if (webauthnAuthentication) {
            resolve(webauthnAuthentication)
          }
        }
      }
      // Add the tab removal listener
      tabs.onRemoved.addListener(removedListener)

      // Define a listener for port communication
      const portListener = (port: Runtime.Port) => {
        if (port.name === PortName.port_createWebauthn) {
          // Listener for credential messages from the new tab
          port.onMessage.addListener(
            (message: WebauthnRegistration | WebauthnError) => {
              if (isWebauthnError(message)) {
                webauthnRegistration = undefined
                webauthnAuthentication = undefined
                webauthnError = message
              } else {
                webauthnRegistration = message as WebauthnRegistration
                webauthnAuthentication = undefined
                webauthnError = undefined
                console.log(
                  `[background][messaging][tab] credential: ${JSON.stringify(
                    webauthnRegistration,
                    (_, value) => {
                      return typeof value === "bigint"
                        ? value.toString()
                        : value
                    },
                    2
                  )}`
                )
                port.postMessage({ out: "got credential!" })
              }
            }
          )
        }
        if (port.name === PortName.port_requestWebauthn) {
          // Listener for signature messages from the new tab
          port.onMessage.addListener(
            (message: WebauthnAuthentication | WebauthnError) => {
              if (isWebauthnError(message)) {
                webauthnRegistration = undefined
                webauthnAuthentication = undefined
                webauthnError = message
              } else {
                webauthnAuthentication = message as WebauthnAuthentication
                webauthnRegistration = undefined
                webauthnError = undefined
                console.log(
                  `[background][messaging][tab] signature: ${JSON.stringify(
                    webauthnAuthentication,
                    (_, value) => {
                      return typeof value === "bigint"
                        ? value.toString()
                        : value
                    },
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
      // Add the port listener
      runtime.onConnect.addListener(portListener)
    } catch (e) {
      // Reject the Promise if an error occurs
      reject(e)
      return
    }
  })
}
