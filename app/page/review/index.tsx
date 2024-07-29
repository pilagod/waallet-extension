import { useEffect, useState } from "react"
import browser from "webextension-polyfill"
import { useHashLocation } from "wouter/use-hash-location"

import { Path } from "~app/path"
import { useAction, usePendingTransactions } from "~app/storage"

import { TransactionConfirmation } from "./transaction"

export function Review() {
  const [, navigate] = useHashLocation()
  const pendingTxs = usePendingTransactions()

  useEffect(() => {
    async function redirect() {
      const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true
      })
      if (tab.url?.includes("notification")) {
        window.close()
      } else {
        navigate(Path.Home)
      }
    }
    if (pendingTxs.length === 0) {
      redirect()
    }
  }, [pendingTxs.length])

  if (pendingTxs.length === 0) {
    return
  }
  const [tx] = pendingTxs

  return (
    <ProfileSwitcher accountId={tx.senderId} networkId={tx.networkId}>
      <TransactionConfirmation tx={tx} />
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
