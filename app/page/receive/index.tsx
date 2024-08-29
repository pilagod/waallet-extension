import { useContext } from "react"
import Copy from "react:~assets/copy.svg"
import Wallet from "react:~assets/wallet.svg"

import { Divider } from "~app/component/divider"
import { QrCode } from "~app/component/qrCode"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { ToastContext } from "~app/context/toastContext"
import { useAccount } from "~app/hook/storage"
import { Address } from "~packages/primitive"

export const Receive = () => {
  const { address, name } = useAccount()
  const { setToast } = useContext(ToastContext)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address.toString())
      setToast("Copy address to clipboard.", "success")
    } catch (e) {
      setToast("Copy address to clipboard.", "failed")
    }
  }

  return (
    <>
      <StepBackHeader title={name} />

      <div className="flex items-center justify-center my-[24px]">
        <QrCode data={generateQrCodeData(address)} size={200} />
      </div>
      <Divider />

      <div className="flex flex-col items-center py-[24px]">
        {/* Wallet and address */}
        <div className="w-full flex items-center py-[16px]">
          <Wallet className="w-[24px] h-[24px] mr-[12px]" />
          <div className="flex-1 min-w-0 text-[16px] text-[#000000] break-words">
            {address.toString()}
          </div>
        </div>
        {/* Copy button */}
        <button
          className="w-full flex items-center justify-center py-[16px] my-[22.5px] rounded-full border-[1px] border-solid border-black bg-black"
          onClick={handleCopy}>
          <Copy className="w-[24px] h-[24px] mr-[8px]" />
          <div className="text-[18px] text-[#FFFFFF] whitespace-nowrap">
            Copy address
          </div>
        </button>
      </div>
    </>
  )
}

const generateQrCodeData = (address: Address): string => {
  // Refer to:
  // https://github.com/MetaMask/metamask-extension/blob/develop/ui/components/ui/qr-code-view/qr-code-view.tsx#L36-L38
  return `ethereum:${address}`
}
