import * as ethers from "ethers"
import { useEffect } from "react"
import { useLocation } from "wouter"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/provider/waallet/content/provider"
import { useProvider } from "~popup/ctx/provider"
import { PopupPath } from "~popup/util/page"

import "~style.css"

export function Setting() {
  const { setProvider, setIndex } = useProvider()
  const [_, setLocation] = useLocation()

  useEffect(() => {
    const _accountIndex = 0
    const _provider = new ethers.BrowserProvider(
      new WaalletContentProvider(new BackgroundDirectMessenger())
    )

    setIndex(_accountIndex)
    setProvider(_provider)
    console.log(`setted`)
    setLocation(PopupPath.info)
  }, [])

  return <></>
}
