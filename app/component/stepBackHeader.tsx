import ArrowLeft from "react:~assets/arrowLeft.svg"
import { Link } from "wouter"

import { Path } from "~app/path"

import { Divider } from "./divider"

type StepBackHeaderProps = {
  title: string
  children?: React.ReactNode
  href: Path
}
//
export const StepBackHeader = (props: StepBackHeaderProps) => {
  const { title, children, href } = props
  return (
    <div className="flex flex-col gap-[16px]">
      <Link href={href}>
        <ArrowLeft />
      </Link>

      <h1 className="text-[24px]">{title}</h1>
      {children}
      <Divider />
    </div>
  )
}
