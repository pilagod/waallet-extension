import * as ethers from "ethers"
import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { PaymasterType } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { UserOperationData } from "~packages/provider/bundler"
import { WaalletContentProvider } from "~packages/provider/waallet/content/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"
import json from "~packages/util/json"
import type { Nullable } from "~typing"

const UserOperationAuthorization = () => {
  const provider = new ethers.BrowserProvider(
    new WaalletContentProvider(new BackgroundDirectMessenger())
  )
  const [port, setPort] = useState<browser.Runtime.Port>(null)
  // TODO: Refactor class state usage
  const [userOpData, setUserOpData] =
    useState<ReturnType<UserOperationData["data"]>>(null)
  const userOp = userOpData ? new UserOperationData(userOpData) : null
  const [paymasterSelected, setPaymasterSelected] = useState(PaymasterType.Null)

  const onPaymasterSelected = async (paymasterType: PaymasterType) => {
    setPaymasterSelected(paymasterType)
    const paymaster = createPaymaster(paymasterType)
    // TODO: Can we skip the estimation phase?
    // This is a special phase for verifying paymaster to construct dummy signature
    userOp.setPaymasterAndData(await paymaster.requestPaymasterAndData(userOp))
    userOp.setGasLimit(
      await provider.send(WaalletRpcMethod.eth_estimateUserOperationGas, [
        userOp.data()
      ])
    )
    setUserOpData(userOp.data())
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
        ...userOp.data(),
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
          setUserOpData(
            new UserOperationData(json.parse(message.userOp)).data()
          )
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
        {userOpData && (
          <span>
            {paymasterSelected === PaymasterType.Verifying
              ? 0
              : ethers.formatEther(userOp.calculateGasFee())}
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
  userOp: Nullable<UserOperationData>
}) => {
  if (!userOp) {
    return <div>Loading...</div>
  }
  return (
    <div>
      {Object.entries(userOp.data()).map(([key, value], i) => {
        return (
          <div key={i}>
            {key}: {value}
          </div>
        )
      })}
    </div>
  )
}

export default UserOperationAuthorization
