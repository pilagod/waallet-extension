import { Redirect, Route, Router, Switch } from "wouter"

import { ProviderCtxProvider } from "~popup/ctx/provider"
import { Info } from "~popup/pages/info"
import { Send } from "~popup/pages/send"
import { useHashLocation } from "~popup/util/location"
import { PopupPath } from "~popup/util/page"

import "~style.css"

function IndexPopup() {
  return (
    <>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path={PopupPath.root}>
            <Redirect to={PopupPath.info} />
          </Route>
          <ProviderCtxProvider>
            <Route path={PopupPath.info} component={Info}></Route>
            <Route path={PopupPath.send} component={Send}></Route>
          </ProviderCtxProvider>
        </Switch>
      </Router>
    </>
  )
}

export default IndexPopup
