import { Redirect, Route, Router, Switch } from "wouter"
import { useShallow } from "zustand/react/shallow"

import { Navbar } from "~app/component/navbar"
import { ProviderContextProvider } from "~app/context/provider"
import { Info } from "~app/pages/info"
import { Send } from "~app/pages/send"
import { useStorage } from "~app/storage"
import { useHashLocation } from "~app/util/location"
import { PopupPath } from "~app/util/page"

import "~style.css"

function App() {
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

export default App
