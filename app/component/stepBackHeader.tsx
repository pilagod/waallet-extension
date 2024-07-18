import ArrowLeft from "react:~assets/arrowLeft.svg"
import { useHashLocation } from "wouter/use-hash-location"

import { Path } from "~app/path"

import { Divider } from "./divider"

type StepBackHeaderProps = {
  title: string
  children?: React.ReactNode
  onStepBack?: () => void
}
export const StepBackHeader = (props: StepBackHeaderProps) => {
  const { title, children, onStepBack } = props
  const [, navigate] = useHashLocation()
  const defaultOnStepBack = () => navigate(Path.Index)
  return (
    <div className="flex flex-col gap-[16px]">
      <button onClick={onStepBack ?? defaultOnStepBack}>
        <ArrowLeft />
      </button>
      <h1 className="text-[24px]">{title}</h1>
      {children}
      <Divider />
    </div>
  )
}
