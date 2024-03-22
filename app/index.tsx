import { Redirect, Route, Router, Switch } from "wouter"
import { useShallow } from "zustand/react/shallow"

import { Navbar } from "~app/component/navbar"
import { ProviderContextProvider } from "~app/context/provider"
import { Info } from "~app/page/info"
import { Send } from "~app/page/send"
import { Path } from "~app/path"
import { useStorage } from "~app/storage"
import { useHashLocation } from "~app/util/location"

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
          <Route path={Path.root}>
            <Redirect to={Path.info} />
          </Route>
          <Route path={Path.info} component={Info}></Route>
          <Route path={Path.send} component={Send}></Route>
        </Switch>
      </Router>
    </ProviderContextProvider>
  )
}

export default App
