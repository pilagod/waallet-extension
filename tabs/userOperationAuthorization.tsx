import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import type { UserOperation } from "~packages/provider/bundler/typing"
import json from "~packages/util/json"
import type { Nullable } from "~typing"

const UserOperationAuthorization = () => {
  const [userOp, setUserOp] = useState<UserOperation>(null)

  const sendUserOperation = () => {
    browser.runtime.sendMessage(browser.runtime.id, {
      userOp: json.stringify(userOp)
    })
  }

  useEffect(() => {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("message:", message)
      console.log("sender:", sender)
      const userOp = json.parse(message.userOp)
      setUserOp(userOp)
      ;(sendResponse as any)({
        status: 0
      })
    })
  }, [])

  return (
    <div>
      <UserOperationPreview userOp={userOp} />
      <button onClick={() => sendUserOperation()}>Send</button>
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
      {Object.keys(userOp).map((key) => {
        return (
          <div>
            {key}: {userOp[key]}
          </div>
        )
      })}
    </div>
  )
}

export default UserOperationAuthorization
