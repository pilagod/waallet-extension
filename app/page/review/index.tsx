import { useEffect, useState } from "react"
import browser from "webextension-polyfill"
import { useHashLocation } from "wouter/use-hash-location"

import { Path } from "~app/path"
import { useAction, usePendingRequests } from "~app/storage"
import { RequestType } from "~storage/local/state"

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

  if (request.type === RequestType.Transaction) {
    return (
      <ProfileSwitcher
        accountId={request.accountId}
        networkId={request.networkId}>
        <TransactionConfirmation tx={request} />
      </ProfileSwitcher>
    )
  }

  return <div>This is a EIP712 request</div>
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
