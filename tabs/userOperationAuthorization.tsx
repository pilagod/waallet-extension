import * as ethers from "ethers"
import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import type { ExchangeRate, Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import type { UserOperation } from "~packages/provider/bundler"
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
  exchangeRate: ExchangeRate
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
  // TODO: Refine typing from Bignumberish to bigint
  const [userOp, setUserOp] = useState<UserOperation>(null)
  const [payment, setPayment] = useState<Payment>({
    option: paymentOptions[0],
    token: ETH,
    exchangeRate: {
      rate: 1n,
      decimals: 0
    }
  })

  const onPaymentOptionSelected = async (paymentOption: PaymentOption) => {
    // TODO: Be able to select token
    setPayment({
      option: paymentOption,
      token: ETH,
      exchangeRate: await paymentOption.paymaster.getExchangeRate(ETH)
    })
    const paymasterUserOp = {
      ...userOp,
      paymasterAndData:
        await paymentOption.paymaster.requestPaymasterAndData(userOp)
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

  const sendUserOperation = async () => {
    port.postMessage({
      userOpAuthorized: json.stringify({
        ...userOp,
        paymasterAndData:
          await payment.option.paymaster.requestPaymasterAndData(userOp)
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

  const estimatedGasFee = userOp
    ? (ethers.toBigInt(userOp.callGasLimit) +
        ethers.toBigInt(userOp.verificationGasLimit) +
        ethers.toBigInt(userOp.preVerificationGas)) *
      ethers.toBigInt(userOp.maxFeePerGas)
    : 0n

  return (
    <div>
      <div>
        <h1>Transaction Detail</h1>
        <UserOperationPreview userOp={userOp} />
      </div>
      <div>
        <h1>Paymaster Option</h1>
        {paymentOptions.map((o, i) => {
          return (
            <div key={i}>
              <input
                type="checkbox"
                id={i.toString()}
                name={o.name}
                checked={o.name === payment.option.name}
                onChange={() => onPaymentOptionSelected(o)}
              />
              <label htmlFor={i.toString()}>{o.name}</label>
            </div>
          )
        })}
      </div>
      <div>
        <h1>Transaction Cost</h1>
        <p>
          Estimated gas fee: {ethers.formatEther(estimatedGasFee)} {ETH.symbol}
        </p>
        <p>
          Expected to pay:{" "}
          {ethers.formatUnits(
            estimatedGasFee * payment.exchangeRate.rate,
            ETH.decimals + payment.exchangeRate.decimals
          )}{" "}
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
