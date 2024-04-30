import * as ethers from "ethers"
import { useState } from "react"
import { useClsState } from "use-cls-state"
import { useDeepCompareEffectNoCheck } from "use-deep-compare-effect"
import { useHashLocation } from "wouter/use-hash-location"

import { useProviderContext } from "~app/context/provider"
import { Path } from "~app/path"
import {
  useAccount,
  useNetwork,
  usePendingUserOperationStatements,
  useStorage
} from "~app/storage"
import type { Account, UserOperationStatement } from "~background/storage"
import { AccountType } from "~packages/account"
import { PasskeyAccount } from "~packages/account/PasskeyAccount"
import { PasskeyOwnerWebAuthn } from "~packages/account/PasskeyAccount/passkeyOwnerWebAuthn"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import { UserOperation } from "~packages/bundler"
import type { Paymaster } from "~packages/paymaster"
import { NullPaymaster } from "~packages/paymaster/NullPaymaster"
import { VerifyingPaymaster } from "~packages/paymaster/VerifyingPaymaster"
import { ETH, Token } from "~packages/token"
import { WaalletRpcMethod } from "~packages/waallet/rpc"

type PaymentOption = {
  name: string
  paymaster: Paymaster
}

type Payment = {
  option: PaymentOption
  token: Token
  tokenFee: bigint
}

export function UserOperationAuthorization() {
  const [, navigate] = useHashLocation()
  const pendingUserOpStmts = usePendingUserOperationStatements()
  if (pendingUserOpStmts.length === 0) {
    navigate(Path.Index)
    return
  }
  return <UserOperationConfirmation userOpStmt={pendingUserOpStmts[0]} />
}

function UserOperationConfirmation(props: {
  userOpStmt: UserOperationStatement
}) {
  const { userOpStmt } = props
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
        expirationSecs: 300
      })
    }
  ]
  const [, navigate] = useHashLocation()
  const { provider } = useProviderContext()
  const markUserOperationSent = useStorage(
    (storage) => storage.markUserOperationSent
  )
  const network = useNetwork(userOpStmt.networkId)
  const sender = useAccount(userOpStmt.senderId)
  const [userOp, setUserOp] = useClsState<UserOperation>(
    new UserOperation(userOpStmt.userOp)
  )
  const [payment, setPayment] = useState<Payment>({
    option: paymentOptions[0],
    token: ETH,
    tokenFee: 0n
  })
  const [userOpSending, setUserOpSending] = useState(false)
  const [paymentCalculating, setPaymentCalculating] = useState(false)

  const onPaymentOptionSelected = async (o: PaymentOption) => {
    // TODO: Be able to select token
    // Should show only tokens imported by user
    setPaymentCalculating(true)
    setPayment({
      ...payment,
      option: o
    })
    userOp.setPaymasterAndData(
      await o.paymaster.requestPaymasterAndData(provider, userOp)
    )
    userOp.setGasLimit(
      await provider.send(WaalletRpcMethod.eth_estimateUserOperationGas, [
        userOp.data()
      ])
    )
    setUserOp(userOp)
  }

  const sendUserOperation = async () => {
    setUserOpSending(true)

    const account = await createAccount(sender)
    try {
      userOp.setSignature(
        await account.sign(
          userOp.hash(userOpStmt.entryPointAddress, network.chainId)
        )
      )
      const userOpHash = await provider.send(
        WaalletRpcMethod.eth_sendUserOperation,
        [userOp.data(), userOpStmt.entryPointAddress]
      )
      markUserOperationSent(userOpStmt.id, userOpHash, userOp.data())
    } catch (e) {
      // TOOD: Show error on page
      console.error(e)
      setUserOpSending(false)
    }
  }

  useDeepCompareEffectNoCheck(() => {
    async function updatePayment() {
      setPaymentCalculating(true)
      setPayment({
        ...payment,
        tokenFee: await payment.option.paymaster.quoteFee(
          userOp.calculateGasFee(),
          ETH
        )
      })
      setPaymentCalculating(false)
    }
    if (userOp) {
      updatePayment()
    }
  }, [userOp])

  return (
    <div>
      <div>
        <h1>Transaction Detail</h1>
        <div>
          {Object.entries(userOp.data()).map(([key, value], i) => {
            return (
              <div key={i}>
                {key}: {value}
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <h1>Paymaster Option</h1>
        {paymentOptions.map((o, i) => {
          const id = i.toString()
          const isSelected = o.name === payment.option.name
          return (
            <div key={i}>
              <input
                type="checkbox"
                id={id}
                name={o.name}
                checked={isSelected}
                disabled={paymentCalculating || isSelected}
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
          {paymentCalculating
            ? "Calculating..."
            : `${ethers.formatUnits(
                payment.tokenFee,
                payment.token.decimals
              )} ${payment.token.symbol}`}
        </p>
      </div>
      <div style={{ marginTop: "1em" }}>
        <button
          disabled={paymentCalculating || userOpSending}
          onClick={() => sendUserOperation()}>
          Send
        </button>
        {/* TODO: Change to reject */}
        <button disabled={userOpSending} onClick={() => navigate(Path.Index)}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// TODO: Redesign a place to accommodate it
async function createAccount(account: Account) {
  switch (account.type) {
    case AccountType.SimpleAccount:
      return SimpleAccount.init({
        address: account.address,
        ownerPrivateKey: account.ownerPrivateKey
      })
    case AccountType.PasskeyAccount:
      return PasskeyAccount.init({
        address: account.address,
        owner: new PasskeyOwnerWebAuthn(account.credentialId)
      })
    default:
      throw new Error(`Unknown account ${account}`)
  }
}
