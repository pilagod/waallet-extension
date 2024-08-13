export const ScrollableWrapper = ({
  x = false,
  children,
  className
}: {
  x?: boolean
  children?: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={`w-[calc(100%+32px)] ml-[-16px] ${
        x ? "overflow-x-scroll" : "overflow-x-hidden"
      } "overflow-y-scroll" ${className}`}>
      {children}
    </div>
  )
}
