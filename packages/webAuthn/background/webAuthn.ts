import browser from "webextension-polyfill"

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

export const createWebAuthn = async (webAuthnCreation?: WebAuthnCreation) => {
  const createWebAuthnParams = new URLSearchParams({
    user: webAuthnCreation?.user ? encodeURI(webAuthnCreation.user) : "",
    challengeCreation: webAuthnCreation?.challenge
      ? webAuthnCreation.challenge
      : ""
  })
  const url = `${browser.runtime.getURL(
    "tabs/index.html"
  )}?${createWebAuthnParams.toString()}#webauthn/registration`

  return {
    result: listenToWebAuthnRegistration(),
    cancel: await openWebAuthnWindow(url)
  }
}

export const requestWebAuthn = async (webAuthnRequest: WebAuthnRequest) => {
  const requestWebAuthnParams = new URLSearchParams({
    credentialId: webAuthnRequest.credentialId
      ? webAuthnRequest.credentialId
      : "",
    challengeRequest: webAuthnRequest.challenge
  })
  const url = `${browser.runtime.getURL(
    "tabs/index.html"
  )}?${requestWebAuthnParams.toString()}#webauthn/authentication`

  return {
    result: listenToWebAuthnAuthentication(),
    cancel: await openWebAuthnWindow(url)
  }
}

export const testWebAuthn = async (
  tabId: number,
  { webAuthnCreation, webAuthnRequest }: WebAuthnParams
) => {
  const webAuthnParams = new URLSearchParams({
    tabId: tabId.toString(),
    user: webAuthnCreation?.user ? encodeURI(webAuthnCreation.user) : "",
    challengeCreation: webAuthnCreation?.challenge
      ? webAuthnCreation.challenge
      : "",
    credentialId: webAuthnRequest.credentialId
      ? webAuthnRequest.credentialId
      : "",
    challengeRequest: webAuthnRequest.challenge
  })
  const url = `${browser.runtime.getURL(
    "tabs/index.html"
  )}?${webAuthnParams.toString()}#webauthn/devtool`

  return {
    result: Promise.any([
      listenToWebAuthnRegistration(),
      listenToWebAuthnAuthentication()
    ]),
    cancel: await openWebAuthnWindow(url)
  }
}

const openWebAuthnWindow = async (url: string) => {
  // Set a sufficiently large window size for testing.
  const windowSize = url.includes("tabs/webAuthn.html") ? 500 : 1
  const w = await browser.windows.create({
    url,
    focused: true,
    type: "popup",
    width: windowSize,
    height: windowSize
  })
  return async () => {
    await browser.windows.remove(w.id)
  }
}

const listenToWebAuthnRegistration = () => {
  return new Promise<WebAuthnRegistration>((resolve, reject) => {
    const portOnConnectHandler = (port: browser.Runtime.Port) => {
      if (port.name !== PortName.port_createWebAuthn) {
        return
      }
      // Listen to credential message
      port.onMessage.addListener(
        (message: WebAuthnRegistration | WebAuthnError) => {
          if (isWebAuthnError(message)) {
            return reject(message.error)
          }
          console.log(
            `[background][messaging][window] credential: ${json.stringify(
              message,
              null,
              2
            )}`
          )
          return resolve(message)
        }
      )
      // Remove the port handler on disconnect
      port.onDisconnect.addListener(() => {
        browser.runtime.onConnect.removeListener(portOnConnectHandler)
      })
    }
    browser.runtime.onConnect.addListener(portOnConnectHandler)
  })
}

const listenToWebAuthnAuthentication = () => {
  return new Promise<WebAuthnAuthentication>((resolve, reject) => {
    const portOnConnectHandler = (port: browser.Runtime.Port) => {
      if (port.name !== PortName.port_requestWebAuthn) {
        return
      }
      // Listen to signature message
      port.onMessage.addListener(
        (message: WebAuthnAuthentication | WebAuthnError) => {
          if (isWebAuthnError(message)) {
            return reject(message.error)
          }
          console.log(
            `[background][messaging][window] signature: ${json.stringify(
              message,
              null,
              2
            )}`
          )
          return resolve(message)
        }
      )
      // Remove the port handler on disconnect
      port.onDisconnect.addListener(() => {
        browser.runtime.onConnect.removeListener(portOnConnectHandler)
      })
    }
    browser.runtime.onConnect.addListener(portOnConnectHandler)
  })
}
