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
  AttestationConveyancePreference,
  AuthenticatorAttachment,
  COSEAlgorithmIdentifier,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialDescriptorJSON,
  PublicKeyCredentialType,
  UserVerificationRequirement
} from "@simplewebauthn/typescript-types"
import { AbiCoder } from "ethers"
import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"

import { useMessage } from "@plasmohq/messaging/hook"

const ethersAbi = AbiCoder.defaultAbiCoder()
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  // The "all_frames" field determines whether files are injected into all frames meeting URL requirements or only into the top frame in a tab.
  all_frames: true,
  // Specifies the timing for injecting JavaScript files into the web page. The default is document_idle, injecting a script into a target context to run at document_idle. If the script returns a promise, the browser waits for it to settle before returning the result.
  run_at: "document_idle"
}

export enum ContentMethod {
  content_createWebauthn = "content_createWebauthn"
}

export type ContentRequestArguments = ContentCreateWebauthnArguments

export type ContentCreateWebauthnArguments = {
  method: ContentMethod.content_createWebauthn
  params: {
    tabId?: number
    user?: string
    chalBase64Url?: string
    authAttach?: AuthenticatorAttachment
  }
}

const Messages = () => {
  const [status, setStatus] = useState<string>("")

  const { data: _ } = useMessage<Record<string, any>, Record<string, any>>(
    async (req, res) => {
      console.log(`[contents][messages] req: ${JSON.stringify(req, null, 2)}`)

      if (!req.body.method) {
        setStatus("method not found")
      }
      if (req.body.method) {
        switch (req.body.method) {
          case ContentMethod.content_createWebauthn: {
            const cred = await handleCreateWebauthn(req.body.params)
            console.log(
              `[contents][messages] cred: ${JSON.stringify(cred, null, 2)}`
            )
            // When requesting the Content Script to create a WebAuthn, the response is consistently undefined.
            res.send(cred)
            setStatus("Webauthn creation successful.")
            break
          }
          default: {
            // Send the information back to the window or tab that called sendToContentScript().
            res.send(req.body)
            setStatus("no method matching")
            break
          }
        }
      }
    }
  )

  return (
    <div
      style={{
        padding: 8,
        background: "#333",
        color: "red"
      }}>
      Status: {status}
    </div>
  )
}

export default Messages

/*********************************
 *            Helpers            *
 *********************************/
export const handleCreateWebauthn = async (params: {
  tabId?: number // Not to use
  user?: string
  chalBase64Url?: string
  authAttach?: AuthenticatorAttachment
}): Promise<{
  orig: string
  credIdBase64Url: string
  credPubKeyXUint256String: string
  credPubKeyYUint256String: string
}> => {
  const chalBase64Url = params.chalBase64Url
    ? params.chalBase64Url
    : isoBase64URL.fromBuffer(await generateChallenge())
  const authAttach =
    params.authAttach &&
    (params.authAttach.toString() === "platform" ||
      params.authAttach.toString() === "cross-platform")
      ? params.authAttach
      : ("cross-platform" as AuthenticatorAttachment)

  const userDisplayName = params.user ? decodeURI(params.user) : "user"
  const name = userDisplayName.toLowerCase().replace(/[^\w]/g, "")
  const id = Date.now().toString()
  const userId = `${name}-${id}`
  const userName = `${name}-${id}@${defaultWebauthn.rpName}`

  // Create Webauthn
  const regResJSON = await startRegistration({
    rp: {
      name: defaultWebauthn.rpName
      // id: defaultWebauthn.rpId
    },
    user: {
      id: userId,
      name: userName,
      displayName: userDisplayName
    },
    challenge: chalBase64Url,
    pubKeyCredParams: [
      {
        alg: defaultWebauthn.pubKeyCredAlgEs256,
        type: defaultWebauthn.pubKeyCredType
      },
      {
        alg: defaultWebauthn.pubKeyCredAlgRs256,
        type: defaultWebauthn.pubKeyCredType
      }
    ],
    timeout: defaultWebauthn.timeout,
    excludeCredentials: defaultWebauthn.excludeCredentials,
    authenticatorSelection: {
      authenticatorAttachment: authAttach,
      requireResidentKey: defaultWebauthn.requireResidentKey,
      residentKey: defaultWebauthn.residentKeyRequirement,
      userVerification: defaultWebauthn.userVerificationRequirement
    },
    attestation: defaultWebauthn.attestationConveyancePreference,
    extensions: defaultWebauthn.extensions
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
    `[webauthn][debug]\nuserDisplayName: ${userDisplayName}\nchalBase64Url: ${chalBase64Url}\nauthAttach: ${authAttach}\ncredPubKeyXHex: ${credPubKeyXHex}\ncredPubKeyYHex: ${credPubKeyYHex}`
  )
  return {
    orig: origin,
    credIdBase64Url: credIdBase64Url,
    credPubKeyXUint256String: `${credPubKeyXUint256}`,
    credPubKeyYUint256String: `${credPubKeyYUint256}`
  }
}

export const defaultWebauthn = {
  attestationConveyancePreference: "none" as AttestationConveyancePreference,
  // This Relying Party will accept either an ES256 or RS256 credential, but prefers an ES256 credential.
  pubKeyCredAlgEs256: -7 as COSEAlgorithmIdentifier,
  pubKeyCredAlgRs256: -257 as COSEAlgorithmIdentifier,
  // Try to use UV if possible. This is also the default.
  pubKeyCredType: "public-key" as PublicKeyCredentialType,
  // https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client
  authenticatorAttachment: "cross-platform" as AuthenticatorAttachment,
  residentKeyRequirement: "required" as ResidentKeyRequirement,
  userVerificationRequirement: "required" as UserVerificationRequirement,
  timeout: 300000, // 5 minutes
  // Relying Party
  rpName: "Waallet Extension",
  // localhost
  rpId: `${window.location.hostname}`,
  // Make excludeCredentials check backwards compatible with credentials registered with U2F
  extensions: {
    largeBlob: {
      support: "preferred" // "required", "preferred"
    }
  },
  requireResidentKey: true,
  // Don’t re-register any authenticator that has one of these credentials
  excludeCredentials: [] as PublicKeyCredentialDescriptorJSON[]
}
