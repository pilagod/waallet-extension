import { Divider } from "~app/component/divider"
import { QrCode } from "~app/component/qrcode"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { Path } from "~app/path"
import { useAccount } from "~app/storage"

export const Receive = () => {
  const { address } = useAccount()

  return (
    <>
      <StepBackHeader
        title={"Jesse's wallet"}
        href={Path.Index}></StepBackHeader>
      <div className="flex items-center justify-center my-[24px] py-[24px]">
        <QrCode address={address} />
      </div>
      <Divider />
    </>
  )
}
