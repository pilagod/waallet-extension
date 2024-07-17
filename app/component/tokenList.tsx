export const TokenList = ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div className={`w-full flex flex-col items-start ${className}`}>
      {children}
    </div>
  )
}
