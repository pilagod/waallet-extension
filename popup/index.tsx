import { useEffect } from "react"
// Plasmo can't resolve wouter v3, so we use wouter v2
import { Redirect, Route, Router, Switch } from "wouter"

import { ProviderCtxProvider } from "~popup/ctx/provider"
import { Info } from "~popup/pages/info"
import { Setting } from "~popup/pages/setting"
import { useHashLocation } from "~popup/util/location"
import { PopupPath } from "~popup/util/page"

import "~style.css"

function IndexPopup() {
  return (
    <>
      <Router hook={useHashLocation}>
        <Switch>
          <Route path={PopupPath.root}>
            <Redirect to={PopupPath.setting} />
          </Route>
          <ProviderCtxProvider>
            <Route path={PopupPath.setting} component={Setting}></Route>
            <Route path={PopupPath.info} component={Info}></Route>
          </ProviderCtxProvider>
        </Switch>
      </Router>
    </>
  )
}

export default IndexPopup
