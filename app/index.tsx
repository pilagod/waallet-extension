import { useEffect } from "react"
import browser from "webextension-polyfill"
import { Redirect, Route, Router, Switch } from "wouter"
import { useHashLocation } from "wouter/use-hash-location"
import { useShallow } from "zustand/react/shallow"

import { ProviderContextProvider } from "~app/context/provider"
import { TransactionAuthorization } from "~app/page/authorization/transaction"
import { Info } from "~app/page/info"
import { Send } from "~app/page/send"
import { WebAuthnAuthentication } from "~app/page/webauthn/authentication"
import { WebAuthnDevtool } from "~app/page/webauthn/devtool"
import { WebAuthnRegistration } from "~app/page/webauthn/registration"
import { Path } from "~app/path"
import { usePendingTransactions, useStorage } from "~app/storage"

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
      <div className="w-[480px] h-[600px] break-all px-[16px] pt-[20px]">
        <PageRouter />
      </div>
    </ProviderContextProvider>
  )
}

function PageRouter() {
  const [location, navigate] = useHashLocation()
  // https://github.com/molefrog/wouter/issues/132#issuecomment-704372204
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  const pendingTxs = usePendingTransactions()
  if (
    pendingTxs.length > 0 &&
    !location.startsWith(Path.TransactionAuthorization)
  ) {
    navigate(Path.TransactionAuthorization)
    return
  }

  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path={Path.Info} component={Info} />
        <Route path={Path.Send} component={Send} />

        <Route
          path={Path.WebAuthnRegistration}
          component={WebAuthnRegistration}
        />
        <Route
          path={Path.WebAuthnAuthentication}
          component={WebAuthnAuthentication}
        />
        <Route path={Path.WebAuthnDevtool} component={WebAuthnDevtool} />

        <Route
          path={Path.TransactionAuthorization}
          component={TransactionAuthorization}
        />

        <Route path="*">
          <Redirect to={Path.Info} />
        </Route>
      </Switch>
    </Router>
  )
}
