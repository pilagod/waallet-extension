import { runtime, tabs, windows, type Runtime } from "webextension-polyfill"

import { PortName } from "~packages/account/PasskeyAccount/passkeyOwnerWebauthn/tabs/port"

/**
 * Asynchronously creates a new window and sets up listeners for port communication.
 * @param {string} createWindowUrl - The URL for creating the new window.
 * @returns {Promise<chrome.windows.Window>} A Promise that resolves to the created window.
 */
export function webauthnWindowAsync(createWindowUrl: string) {
  return new Promise(async (resolve, reject) => {
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
          resolve(createdWindow)
        }
      }
      // Add the window removal listener
      windows.onRemoved.addListener(removedListener)

      // Define a listener for port communication
      const portListener = (port: Runtime.Port) => {
        if (port.name === PortName.port_createWebauthn) {
          // Listener for credential messages from the new window
          port.onMessage.addListener((message) => {
            console.log(
              `[background][messaging][window] credential: ${JSON.stringify(
                message,
                (_, value) => {
                  return typeof value === "bigint" ? value.toString() : value
                },
                2
              )}`
            )
            port.postMessage({ out: "got credential!" })
          })
        }
        if (port.name === PortName.port_requestWebauthn) {
          // Listener for signature messages from the new window
          port.onMessage.addListener((message) => {
            console.log(
              `[background][messaging][window] signature: ${JSON.stringify(
                message,
                (_, value) => {
                  return typeof value === "bigint" ? value.toString() : value
                },
                2
              )}`
            )
            port.postMessage({ out: "got signature!" })
          })
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
export function webauthnTabAsync(createTabUrl: string) {
  return new Promise(async (resolve, reject) => {
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
          resolve(createdTab)
        }
      }
      // Add the tab removal listener
      tabs.onRemoved.addListener(removedListener)

      // Define a listener for port communication
      const portListener = (port: Runtime.Port) => {
        if (port.name === PortName.port_createWebauthn) {
          // Listener for credential messages from the new window
          port.onMessage.addListener((message) => {
            console.log(
              `[background][messaging][window] credential: ${JSON.stringify(
                message,
                (_, value) => {
                  return typeof value === "bigint" ? value.toString() : value
                },
                2
              )}`
            )
            port.postMessage({ out: "got credential!" })
          })
        }
        if (port.name === PortName.port_requestWebauthn) {
          // Listener for signature messages from the new window
          port.onMessage.addListener((message) => {
            console.log(
              `[background][messaging][window] signature: ${JSON.stringify(
                message,
                (_, value) => {
                  return typeof value === "bigint" ? value.toString() : value
                },
                2
              )}`
            )
            port.postMessage({ out: "got signature!" })
          })
        }
        // Remove the port listener on disconnect
        port.onDisconnect.addListener(() => {
          runtime.onConnect.removeListener(portListener)
        })
      }
      // Add the port listener
      runtime.onConnect.addListener(portListener)
    } catch (e) {
      reject(e)
      return
    }
  })
}
