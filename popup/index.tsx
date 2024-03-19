import { Redirect, Route, Router, Switch } from "wouter"
import { useShallow } from "zustand/react/shallow"

import { Navbar } from "~popup/component/navbar"
import { ProviderContextProvider } from "~popup/context/provider"
import { Info } from "~popup/pages/info"
import { Send } from "~popup/pages/send"
import { useStorage } from "~popup/storage"
import { useHashLocation } from "~popup/util/location"
import { PopupPath } from "~popup/util/page"

import "~style.css"

function IndexPopup() {
  const isStateInitialized = useStorage(
    useShallow((storage) => storage.state !== null)
  )
  if (!isStateInitialized) {
    return <></>
  }
  return (
    <ProviderContextProvider>
      <Navbar />
      <Router hook={useHashLocation}>
        <Switch>
          <Route path={PopupPath.root}>
            <Redirect to={PopupPath.info} />
          </Route>
          <Route path={PopupPath.info} component={Info}></Route>
          <Route path={PopupPath.send} component={Send}></Route>
        </Switch>
      </Router>
    </ProviderContextProvider>
  )
}

export default IndexPopup
