import { startRegistration } from "@simplewebauthn/browser"
import {
  convertCOSEtoPKCS,
  decodeAttestationObject,
  decodeClientDataJSON,
  generateChallenge,
  isoBase64URL,
  isoUint8Array,
  parseAuthenticatorData
} from "@simplewebauthn/server/helpers"
import type {
  AuthenticatorAttachment,
  PublicKeyCredentialCreationOptionsJSON
} from "@simplewebauthn/typescript-types"
import { AbiCoder } from "ethers"
import type { PlasmoCSConfig } from "plasmo"

import { listen } from "@plasmohq/messaging/message"

import { ContentMethod } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn/content/method"
import {
  contentCreateWebAuthn,
  contentRequestWebAuthn
} from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn/content/webAuthn"
import { defaultWebAuthn } from "~packages/webAuthn"
import type {
  WebAuthnCreation,
  WebAuthnRequest
} from "~packages/webAuthn/typing"
import type { UrlB64String } from "~typing"

const ethersAbi = AbiCoder.defaultAbiCoder()
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  // The "all_frames" field determines whether files are injected into all frames meeting URL requirements or only into the top frame in a tab.
  all_frames: true,
  // Specifies the timing for injecting JavaScript files into the web page. The default is document_idle, injecting a script into a target context to run at document_idle. If the script returns a promise, the browser waits for it to settle before returning the result.
  run_at: "document_idle"
}

// Record the latest Credential ID for signing in future WebAuthn requests.
let credentialId: UrlB64String = ""
// Non-hook usage reference: https://github.com/PlasmoHQ/plasmo/blob/888b6015c3829872f78428ca0f07640989f6608c/api/messaging/src/hook.ts#L18
const Messages = () => {
  listen<Record<string, any>, Record<string, any>>(async (req, res) => {
    console.log(`[contents][messages] req: ${JSON.stringify(req, null, 2)}`)

    if (!req.name) {
      console.log(`[contents][messages] status: method not found`)
      return
    }

    switch (req.name) {
      case ContentMethod.content_createWebAuthn: {
        const cred = await contentCreateWebAuthn(req.body as WebAuthnCreation)
        credentialId = cred.credentialId // Record the credentialId

        // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
        // res.send(cred)
        break
      }
      case ContentMethod.content_requestWebAuthn: {
        const sig = await contentRequestWebAuthn({
          credentialId: credentialId ? credentialId : req.body?.credentialId, // credentialId,
          challenge: req.body.challenge
        } as WebAuthnRequest)
        // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
        // res.send(cred)
        break
      }
      default: {
        // Send the information back to the window or tab that called sendToContentScript().
        res.send(req.body)
        console.log(`[contents][messages] status: No method matching`)
        break
      }
    }
  })
}

Messages()

/*********************************
 *            Helpers            *
 *********************************/
export const handleCreateWebAuthn = async (params: {
  tabId?: number // Not to use
  user?: string
  challengeBase64Url?: string
  authAttach?: AuthenticatorAttachment
}): Promise<{
  orig: string
  credIdBase64Url: string
  credPubKeyXUint256String: string
  credPubKeyYUint256String: string
}> => {
  const challengeBase64Url =
    params &&
    params.challengeBase64Url &&
    isoBase64URL.isBase64(params.challengeBase64Url)
      ? params.challengeBase64Url
      : isoBase64URL.fromBuffer(await generateChallenge())
  const authAttach =
    params &&
    params.authAttach &&
    (params.authAttach.toString() === "platform" ||
      params.authAttach.toString() === "cross-platform")
      ? params.authAttach
      : ("cross-platform" as AuthenticatorAttachment)
  console.log(`authAttach: ${authAttach}`)
  const userDisplayName =
    params && params.user ? decodeURI(params.user) : "user"
  const name = userDisplayName.toLowerCase().replace(/[^\w]/g, "")
  const id = Date.now().toString()
  const userId = `${name}-${id}`
  const userName = `${name}-${id}@${defaultWebAuthn.rpName}`

  // Create WebAuthn
  const regResJSON = await startRegistration({
    rp: {
      name: defaultWebAuthn.rpName
    },
    user: {
      id: userId,
      name: userName,
      displayName: userDisplayName
    },
    challenge: challengeBase64Url,
    pubKeyCredParams: [
      {
        alg: defaultWebAuthn.pubKeyCredAlgEs256,
        type: defaultWebAuthn.pubKeyCredType
      },
      {
        alg: defaultWebAuthn.pubKeyCredAlgRs256,
        type: defaultWebAuthn.pubKeyCredType
      }
    ],
    timeout: defaultWebAuthn.timeout,
    authenticatorSelection: {
      requireResidentKey: defaultWebAuthn.requireResidentKey,
      residentKey: defaultWebAuthn.residentKeyRequirement,
      userVerification: defaultWebAuthn.userVerificationRequirement
    },
    attestation: defaultWebAuthn.attestationConveyancePreference,
    extensions: defaultWebAuthn.extensions
  } as PublicKeyCredentialCreationOptionsJSON)

  const credIdBase64Url = regResJSON.id

  const clientDataJsonBase64Url = regResJSON.response.clientDataJSON
  const decodedClientData = decodeClientDataJSON(clientDataJsonBase64Url)
  const origin = decodedClientData.origin

  const attestObjBase64Url = regResJSON.response.attestationObject
  const attestObjUint8Arr = isoBase64URL.toBuffer(attestObjBase64Url)
  const decodedAttObj = decodeAttestationObject(attestObjUint8Arr)
  const authData = parseAuthenticatorData(decodedAttObj.get("authData"))
  const credPubKeyUint8Arr = authData.credentialPublicKey!
  const credPubKeyObjUint8Arr = convertCOSEtoPKCS(credPubKeyUint8Arr)
  const credPubKeyXLen = (credPubKeyObjUint8Arr.length - 1) / 2 // tag length = 1

  const credPubKeyXUint8Arr = credPubKeyObjUint8Arr.subarray(
    1,
    1 + credPubKeyXLen
  )
  const credPubKeyXHex = `0x${isoUint8Array.toHex(credPubKeyXUint8Arr)}`
  const credPubKeyXUint256 = ethersAbi.decode(
    ["uint256"],
    ethersAbi.encode(["bytes32"], [credPubKeyXHex])
  )[0] as bigint
  const credPubKeyYUint8Arr = credPubKeyObjUint8Arr.subarray(1 + credPubKeyXLen)
  const credPubKeyYHex = `0x${isoUint8Array.toHex(credPubKeyYUint8Arr)}`
  const credPubKeyYUint256 = ethersAbi.decode(
    ["uint256"],
    ethersAbi.encode(["bytes32"], [credPubKeyYHex])
  )[0] as bigint
  console.log(
    `[webAuthn][debug]\nuserDisplayName: ${userDisplayName}\nchallengeBase64Url: ${challengeBase64Url}\nauthAttach: ${authAttach}\ncredPubKeyXHex: ${credPubKeyXHex}\ncredPubKeyYHex: ${credPubKeyYHex}`
  )
  return {
    orig: origin,
    credIdBase64Url: credIdBase64Url,
    credPubKeyXUint256String: `${credPubKeyXUint256}`,
    credPubKeyYUint256String: `${credPubKeyYUint256}`
  }
}
