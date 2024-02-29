import * as ethers from "ethers"
import { useEffect, useState } from "react"
import useDeepCompareEffect from "use-deep-compare-effect"
import browser from "webextension-polyfill"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import type { Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { UserOperation } from "~packages/provider/bundler"
import { WaalletContentProvider } from "~packages/provider/waallet/content/provider"
import { WaalletRpcMethod } from "~packages/provider/waallet/rpc"
import { ETH, Token } from "~packages/token"
import json from "~packages/util/json"
import type { Nullable } from "~typing"

type PaymentOption = {
  name: string
  paymaster: Paymaster
}

type Payment = {
  option: PaymentOption
  token: Token
  tokenFee: bigint
}

const UserOperationAuthorization = () => {
  const provider = new ethers.BrowserProvider(
    new WaalletContentProvider(new BackgroundDirectMessenger())
  )
  const paymentOptions: PaymentOption[] = [
    {
      name: "No Paymaster",
      paymaster: new NullPaymaster()
    },
    {
      name: "Verifying Paymaster",
      paymaster: new VerifyingPaymaster({
        address: process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER,
        ownerPrivateKey:
          process.env.PLASMO_PUBLIC_VERIFYING_PAYMASTER_OWNER_PRIVATE_KEY,
        expirationSecs: 300,
        provider
      })
    }
  ]
  const [port, setPort] = useState<browser.Runtime.Port>(null)
  // TODO: Refactor class state usage
  const [userOpData, setUserOpData] =
    useState<ReturnType<UserOperation["data"]>>(null)
  const userOp = userOpData ? new UserOperation(userOpData) : null
  const [payment, setPayment] = useState<Payment>({
    option: paymentOptions[0],
    token: ETH,
    tokenFee: 0n
  })

  const onPaymentOptionSelected = async (o: PaymentOption) => {
    // TODO: Be able to select token
    // Should show only tokens imported by user
    setPayment({
      ...payment,
      option: o
    })
    userOp.setPaymasterAndData(
      await o.paymaster.requestPaymasterAndData(userOp)
    )
    userOp.setGasLimit(
      await provider.send(WaalletRpcMethod.eth_estimateUserOperationGas, [
        userOp.data()
      ])
    )
    setUserOpData(userOp.data())
  }

  const sendUserOperation = async () => {
    port.postMessage({
      userOpAuthorized: json.stringify({
        ...userOp.data(),
        paymasterAndData:
          await payment.option.paymaster.requestPaymasterAndData(userOp)
      })
    })
  }

  useEffect(() => {
    async function initUserOp() {
      const tab = await browser.tabs.getCurrent()
      const port = browser.runtime.connect({
        name: `PopUpUserOperationAuthorizer#${tab.id}`
      })
      port.onMessage.addListener(async (message) => {
        console.log("message from background", message)
        if (message.userOp) {
          setUserOpData(new UserOperation(json.parse(message.userOp)).data())
        }
      })
      setPort(port)
      port.postMessage({ init: true })
    }
    initUserOp()
  }, [])

  useDeepCompareEffect(() => {
    async function updatePayment() {
      setPayment({
        ...payment,
        tokenFee: await payment.option.paymaster.quoteFee(
          userOp.calculateGasFee(),
          ETH
        )
      })
    }
    if (userOp) {
      updatePayment()
    }
  }, [userOpData, payment])

  return (
    <div>
      <div>
        <h1>Transaction Detail</h1>
        <UserOperationPreview userOp={userOp} />
      </div>
      <div>
        <h1>Paymaster Option</h1>
        {paymentOptions.map((o, i) => {
          const id = i.toString()
          return (
            <div key={i}>
              <input
                type="checkbox"
                id={id}
                name={o.name}
                checked={o.name === payment.option.name}
                onChange={() => onPaymentOptionSelected(o)}
              />
              <label htmlFor={id}>{o.name}</label>
            </div>
          )
        })}
      </div>
      <div>
        <h1>Transaction Cost</h1>
        <p>
          Estimated gas fee:{" "}
          {ethers.formatEther(userOp ? userOp.calculateGasFee() : 0n)}{" "}
          {ETH.symbol}
        </p>
        <p>
          Expected to pay:{" "}
          {ethers.formatUnits(payment.tokenFee, payment.token.decimals)}{" "}
          {payment.token.symbol}
        </p>
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
