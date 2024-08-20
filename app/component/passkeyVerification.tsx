import Passkey from "react:~assets/passkey.svg"

export function PasskeyVerification(props: { purpose: string }) {
  return (
    <div className="w-full h-full flex flex-col gap-[43px] items-center justify-center">
      <Passkey />
      <span className="text-[24px] text-center">
        Use passkey to verify {props.purpose}
      </span>
    </div>
  )
}
