import { useEffect } from "react"
import browser from "webextension-polyfill"
import { Redirect, Route, Router, Switch } from "wouter"
import { useHashLocation } from "wouter/use-hash-location"
import { useShallow } from "zustand/react/shallow"

import { ProviderContextProvider } from "~app/context/provider"
import { TransactionAuthorization } from "~app/page/authorization/transaction"
import { Home } from "~app/page/home"
import { Send } from "~app/page/send"
import { WebAuthnAuthentication } from "~app/page/webauthn/authentication"
import { WebAuthnDevtool } from "~app/page/webauthn/devtool"
import { WebAuthnRegistration } from "~app/page/webauthn/registration"
import { Path } from "~app/path"
import { useStorage } from "~app/storage"

import "~style.css"

import { Toast } from "./component/toast"

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

  const toast = useStorage(useShallow((storage) => storage.state.toast))
  const setToast = useStorage(useShallow((storage) => storage.setToast))
  const showToast = toast && toast.message && toast.status

  useEffect(() => {
    if (toast && toast.message && toast.status) {
      const timer = setTimeout(() => {
        setToast(null, null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [toast, setToast])

  if (!isStateInitialized) {
    return <></>
  }
  return (
    <ProviderContextProvider>
      {/* Waallet popup script page */}
      <div className="w-[390px] h-[700px] px-[16px] pt-[20px]">
        {showToast && <Toast status={toast.status} message={toast.message} />}
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

  const hasPendingTx = useStorage(
    useShallow(({ state }) => Object.keys(state.pendingTransaction).length > 0)
  )
  if (hasPendingTx && !location.startsWith(Path.TransactionAuthorization)) {
    navigate(Path.TransactionAuthorization)
    return
  }

  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path={Path.Home} component={Home} />
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
          <Redirect to={Path.Home} />
        </Route>
      </Switch>
    </Router>
  )
}
