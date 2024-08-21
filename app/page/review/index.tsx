import { useContext, useEffect, useState } from "react"
import browser from "webextension-polyfill"
import { useHashLocation } from "wouter/use-hash-location"

import { ProviderContext } from "~app/context/provider"
import {
  useAccountWithActor,
  useAction,
  useNetwork,
  usePendingRequests
} from "~app/hook/storage"
import { Path } from "~app/path"
import { RequestType, type Request } from "~storage/local/state"

import { Eip712Confirmation } from "./eip712"
import { TransactionConfirmation } from "./transaction"

export function Review() {
  const [, navigate] = useHashLocation()
  const pendingRequests = usePendingRequests()

  useEffect(() => {
    async function redirect() {
      const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true
      })
      if (tab?.url?.includes("notification")) {
        window.close()
      } else {
        navigate(Path.Home)
      }
    }
    if (pendingRequests.length === 0) {
      redirect()
    }
  }, [pendingRequests.length])

  if (pendingRequests.length === 0) {
    return
  }

  const [request] = pendingRequests

  return (
    <ProfileSwitcher
      accountId={request.accountId}
      networkId={request.networkId}>
      <PendingRequestConfirmation request={pendingRequests[0]} />
    </ProfileSwitcher>
  )
}

function ProfileSwitcher(props: {
  accountId: string
  networkId: string
  children: React.ReactNode
}) {
  const { accountId, networkId, children } = props

  const { switchProfile } = useAction()

  const [profileSwitching, setProfileSwitching] = useState(false)

  useEffect(() => {
    setProfileSwitching(true)
    switchProfile({ accountId, networkId }).then(() => {
      setProfileSwitching(false)
    })
  }, [accountId, networkId])

  if (profileSwitching) {
    return
  }

  return children
}

function PendingRequestConfirmation(props: { request: Request }) {
  const { request } = props

  const { provider } = useContext(ProviderContext)

  const account = useAccountWithActor(provider, request.accountId)
  const network = useNetwork(request.networkId)

  if (!account.actorLoaded) {
    return
  }

  if (request.type === RequestType.Transaction) {
    return (
      <TransactionConfirmation
        tx={request}
        account={account}
        network={network}
      />
    )
  }

  if (request.type === RequestType.Eip712) {
    return (
      <Eip712Confirmation
        request={request}
        account={account}
        network={network}
      />
    )
  }

  throw new Error("Unknown request")
}
