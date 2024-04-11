import { useEffect } from "react"
import browser from "webextension-polyfill"
import { Redirect, Route, Router, Switch } from "wouter"
import { useHashLocation } from "wouter/use-hash-location"
import { useShallow } from "zustand/react/shallow"

import { ProviderContextProvider } from "~app/context/provider"
import { UserOperationAuthorization } from "~app/page/authorization/userOperation"
import { Info } from "~app/page/info"
import { Send } from "~app/page/send"
import { WebAuthnAuthentication } from "~app/page/webauthn/authentication"
import { WebAuthnDevTool } from "~app/page/webauthn/devtool"
import { WebAuthnRegistration } from "~app/page/webauthn/registration"
import { Path } from "~app/path"
import { usePendingUserOperationStatements, useStorage } from "~app/storage"

import "~style.css"

export function App() {
  useEffect(() => {
    const port = browser.runtime.connect({
      name: "app"
    })
    port.onMessage.addListener((message: { action: string }) => {
      if (message.action === "ping") {
        port.postMessage({ action: "pong" })
      }
    })
  }, [])

  const isStateInitialized = useStorage(
    useShallow((storage) => storage.state !== null)
  )
  if (!isStateInitialized) {
    return <></>
  }
  return (
    <ProviderContextProvider>
      <PageRouter />
    </ProviderContextProvider>
  )
}

function PageRouter() {
  const [location, navigate] = useHashLocation()
  const pendingUserOps = usePendingUserOperationStatements()
  if (
    pendingUserOps.length > 0 &&
    !location.startsWith("/authorization/userOperation")
  ) {
    navigate("/authorization/userOperation")
    return
  }
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path={Path.info} component={Info}></Route>
        <Route path={Path.send} component={Send}></Route>
        <Route path="/webauthn" nest>
          <Route path="/registration" component={WebAuthnRegistration}></Route>
          <Route
            path="/authentication"
            component={WebAuthnAuthentication}></Route>
          <Route path="/devtool" component={WebAuthnDevTool}></Route>
        </Route>
        <Route path="/authorization" nest>
          <Route
            path="/userOperation"
            component={UserOperationAuthorization}></Route>
        </Route>
        <Route path="*">
          <Redirect to={Path.info} />
        </Route>
      </Switch>
    </Router>
  )
}
