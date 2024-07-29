export const ScrollableWrapper = ({
  children,
  className
}: {
  children?: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={`w-[calc(100%+32px)] ml-[-16px] overflow-x-hidden overflow-y-scroll ${className}`}>
      {children}
    </div>
  )
}
