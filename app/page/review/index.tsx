import { useEffect, useState } from "react"
import { useHashLocation } from "wouter/use-hash-location"

import { Path } from "~app/path"
import { useAction, usePendingTransactions } from "~app/storage"

import { TransactionConfirmation } from "./transaction"

function ProfileSwithcher(props: {
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

export function Review() {
  const [, navigate] = useHashLocation()
  const pendingTxs = usePendingTransactions()
  if (pendingTxs.length === 0) {
    navigate(Path.Index)
    return
  }
  const [tx] = pendingTxs

  return (
    <ProfileSwithcher accountId={tx.senderId} networkId={tx.networkId}>
      <TransactionConfirmation tx={tx} />
    </ProfileSwithcher>
  )
}
