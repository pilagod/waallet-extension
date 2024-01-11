import { useEffect, useState } from "react"
import browser from "webextension-polyfill"

import type { UserOperation } from "~packages/provider/bundler/typing"
import json from "~packages/util/json"
import type { Nullable } from "~typing"

const UserOperationAuthorization = () => {
  const [port, setPort] = useState<browser.Runtime.Port>(null)
  const [userOp, setUserOp] = useState<UserOperation>(null)

  const sendUserOperation = () => {
    port.postMessage({
      userOpAuthorized: json.stringify(userOp)
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
      <UserOperationPreview userOp={userOp} />
      <button onClick={() => sendUserOperation()}>Send</button>
      <button onClick={() => window.close()}>Cancel</button>
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
