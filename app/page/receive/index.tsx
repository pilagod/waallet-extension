import Copy from "react:~assets/copy.svg"
import Wallet from "react:~assets/wallet.svg"

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

      <div className="flex flex-col items-center py-[24px]">
        {/* Wallet and address */}
        <div className="w-full flex items-center py-[16px]">
          <Wallet className="w-[24px] h-[24px] mr-[12px]" />
          <div className="flex-1 min-w-0 text-[16px] text-[#000000] break-words">
            {address}
          </div>
        </div>
        {/* Copy button */}
        <button className="flex items-center p-[16px_104.5px_16px_104.5px] my-[22.5px] rounded-full border-[1px] border-solid border-black bg-black">
          <Copy className="w-[24px] h-[24px] mr-[8px]" />
          <div className="text-[18px] text-[#FFFFFF] whitespace-nowrap">
            Copy address
          </div>
        </button>
      </div>
      <Divider />
    </>
  )
}
