import * as ethers from "ethers"
import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { PaymasterType } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import type { UserOperation } from "~packages/provider/bundler"
import { WaalletContentProvider } from "~packages/provider/waallet/content/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"
import json from "~packages/util/json"
import type { Nullable } from "~typing"

const UserOperationAuthorization = () => {
  const provider = new ethers.BrowserProvider(
    new WaalletContentProvider(new BackgroundDirectMessenger())
  )
  const [port, setPort] = useState<browser.Runtime.Port>(null)
  // TODO: Refine typing from Bignumberish to bigint
  const [userOp, setUserOp] = useState<UserOperation>(null)
  const [paymasterSelected, setPaymasterSelected] = useState(PaymasterType.Null)

  const onPaymasterSelected = async (paymasterType: PaymasterType) => {
    setPaymasterSelected(paymasterType)
    const paymaster = createPaymaster(paymasterType)
    // TODO: Can we skip the estimation phase?
    // This is a special phase for verifying paymaster to construct dummy signature
    const paymasterUserOp = {
      ...userOp,
      paymasterAndData: await paymaster.requestPaymasterAndData(userOp, {
        isGasEstimation: true
      })
    }
    const gasLimits = await provider.send(
      WaalletRpcMethod.eth_estimateUserOperationGas,
      [paymasterUserOp]
    )
    setUserOp({
      ...paymasterUserOp,
      ...gasLimits
    })
  }

  const createPaymaster = (paymasterType: PaymasterType) => {
    switch (paymasterType) {
      case PaymasterType.Null:
        return new NullPaymaster()
      case PaymasterType.Verifying:
        return new VerifyingPaymaster({
          address: process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER,
          ownerPrivateKey:
            process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER_OWNER_PRIVATE_KEY,
          expirationSecs: 300,
          provider
        })
      default:
        throw new Error("Unknown paymaster type")
    }
  }

  const sendUserOperation = async () => {
    const paymaster = createPaymaster(paymasterSelected)
    port.postMessage({
      userOpAuthorized: json.stringify({
        ...userOp,
        paymasterAndData: await paymaster.requestPaymasterAndData(userOp)
      })
    })
  }

  useEffect(() => {
    async function setup() {
      const tab = await browser.tabs.getCurrent()
      const port = browser.runtime.connect({
        name: `PopUpUserOperationAuthorizer#${tab.id}`
      })
      port.onMessage.addListener(async (message) => {
        console.log("message from background", message)
        if (message.userOp) {
          setUserOp(json.parse(message.userOp))
        }
      })
      setPort(port)
      port.postMessage({ init: true })
    }
    setup()
  }, [])

  return (
    <div>
      <div>
        <h1>Transaction Detail</h1>
        <UserOperationPreview userOp={userOp} />
      </div>
      <div>
        <h1>Paymaster Option</h1>
        {[
          {
            type: PaymasterType.Null,
            name: "No Paymaster"
          },
          {
            type: PaymasterType.Verifying,
            name: "Verifying Paymaster"
          }
        ].map(({ type, name }, i) => {
          const id = type.toString()
          return (
            <div key={i}>
              <input
                type="checkbox"
                id={id}
                name={name}
                checked={type === paymasterSelected}
                onChange={() => onPaymasterSelected(type)}
              />
              <label htmlFor={id}>{name}</label>
            </div>
          )
        })}
      </div>
      <div>
        <h1>Estimated Gas Fee</h1>
        {userOp && (
          <span>
            {paymasterSelected === PaymasterType.Verifying
              ? 0
              : ethers.formatEther(
                  (ethers.toBigInt(userOp.callGasLimit) +
                    ethers.toBigInt(userOp.verificationGasLimit) +
                    ethers.toBigInt(userOp.preVerificationGas)) *
                    ethers.toBigInt(userOp.maxFeePerGas)
                )}
          </span>
        )}
      </div>
      <div style={{ marginTop: "1em" }}>
        <button onClick={() => sendUserOperation()}>Send</button>
        <button onClick={() => window.close()}>Cancel</button>
      </div>
    </div>
  )
}

const UserOperationPreview = ({
  userOp
}: {
  userOp: Nullable<UserOperation>
}) => {
  if (!userOp) {
    return <div>Loading...</div>
  }
  return (
    <div>
      {Object.keys(userOp).map((key, i) => {
        return (
          <div key={i}>
            {key}: {userOp[key]}
          </div>
        )
      })}
    </div>
  )
}

export default UserOperationAuthorization
