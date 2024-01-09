import { p256 } from "@noble/curves/p256"
import { startAuthentication, startRegistration } from "@simplewebauthn/browser"
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
  COSEAlgorithmIdentifier,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialDescriptorJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialType,
  UserVerificationRequirement
} from "@simplewebauthn/typescript-types"
import { AbiCoder } from "ethers"

import type {
  WebauthnAuthentication,
  WebauthnCreation,
  WebauthnRegistration,
  WebauthnRequest
} from "~packages/webauthn/typing"
import type { UrlB64String } from "~typing"

const ethersAbi = AbiCoder.defaultAbiCoder()

export const createWebauthn = async (
  params?: WebauthnCreation
): Promise<WebauthnRegistration> => {
  const challengeBase64Url =
    params && params.challenge && isoBase64URL.isBase64(params.challenge)
      ? params.challenge
      : isoBase64URL.fromBuffer(await generateChallenge())
  const userDisplayName =
    params && params.user ? decodeURI(params.user) : "user"

  const name = userDisplayName.toLowerCase().replace(/[^\w]/g, "")
  const id = new Date()
    .toISOString()
    .slice(0, 23)
    .replace("T", "_")
    .replace(".", "_")
  const userId = `${name}_${id}`
  const userName = `${name}_${id}@${defaultWebauthn.rpName}`

  // Create Webauthn
  const regResJSON = await startRegistration({
    rp: {
      name: defaultWebauthn.rpName
    },
    user: {
      id: userId,
      name: userName,
      displayName: userDisplayName
    },
    challenge: challengeBase64Url,
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
    authenticatorSelection: {
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
    `[webauthn][debug]\nuserDisplayName: ${userDisplayName}\nchallengeBase64Url: ${challengeBase64Url}\ncredPubKeyXHex: ${credPubKeyXHex}\ncredPubKeyYHex: ${credPubKeyYHex}`
  )
  return {
    origin: origin,
    credentialId: credIdBase64Url,
    publicKeyX: credPubKeyXUint256,
    publicKeyY: credPubKeyYUint256
  } as WebauthnRegistration
}

export const requestWebauthn = async (
  params: WebauthnRequest
): Promise<WebauthnAuthentication> => {
  const authResJson = await startAuthentication({
    ...(params.credentialId
      ? {
          allowCredentials: [
            { id: params.credentialId, type: defaultWebauthn.pubKeyCredType }
          ] as PublicKeyCredentialDescriptorJSON[]
        }
      : {}),
    userVerification: defaultWebauthn.userVerificationRequirement,
    challenge: params.challenge
  } as PublicKeyCredentialRequestOptionsJSON)

  const authDataUrlB64 = authResJson.response.authenticatorData
  const authDataHex = `0x${isoUint8Array.toHex(
    isoBase64URL.toBuffer(authDataUrlB64)
  )}`
  const clientDataJsonUrlB64 = authResJson.response.clientDataJSON
  const clientDataJsonUtf8 = isoBase64URL.toString(clientDataJsonUrlB64)
  const sigUrlB64 = authResJson.response.signature
  const [sigRUint, sigSUint] = parseSignature(sigUrlB64)
  //   console.log(`[Test][P256]`)

  //   console.log(`[Test][P256] r: ${p256Sig.r}`)
  //   console.log(`[Test][P256] s: ${p256Sig.s}`)
  return {
    authenticatorData: authDataHex,
    clientDataJson: clientDataJsonUtf8,
    sigantureR: sigRUint,
    signatureS: sigSUint
  } as WebauthnAuthentication
}

export const defaultWebauthn = {
  attestationConveyancePreference: "none" as AttestationConveyancePreference,
  // This Relying Party will accept either an ES256 or RS256 credential, but prefers an ES256 credential.
  pubKeyCredAlgEs256: -7 as COSEAlgorithmIdentifier, // ES256 (Webauthn's default algorithm)
  pubKeyCredAlgRs256: -257 as COSEAlgorithmIdentifier, // RS256 (for Windows Hello and others)
  // Try to use UV if possible. This is also the default.
  pubKeyCredType: "public-key" as PublicKeyCredentialType,
  residentKeyRequirement: "required" as ResidentKeyRequirement,
  userVerificationRequirement: "required" as UserVerificationRequirement,
  timeout: 300000, // 5 minutes
  // Relying Party
  rpName: "Waallet Extension",
  // Make excludeCredentials check backwards compatible with credentials registered with U2F
  extensions: {
    largeBlob: {
      support: "preferred" // "required", "preferred"
    }
  },
  requireResidentKey: true
}

const parseSignature = (signature: UrlB64String): [bigint, bigint] => {
  if (!isoBase64URL.isBase64url(signature)) {
    console.log(`${signature} is not Base64Url`)
    return [BigInt(0), BigInt(0)] as const
  }
  const n = BigInt(
    "0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"
  )
  const p256Sig = p256.Signature.fromDER(
    isoUint8Array.toHex(isoBase64URL.toBuffer(signature))
  )
  // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
  let p256SigS = p256Sig.s
  if (p256SigS > n / BigInt(2)) {
    p256SigS = n - p256SigS
  }
  return [p256Sig.r, p256SigS]
}
