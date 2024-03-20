import type { ReactNode } from "react"

import { Navbar } from "~app/component/navbar"

export function NavbarLayout(props: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {props.children}
    </>
  )
}
