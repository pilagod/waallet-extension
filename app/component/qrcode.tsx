import QRCodeStyling, { type Options } from "qr-code-styling"
import { useEffect, useRef, type FC } from "react"

import byte from "~packages/util/byte"
import type { HexString } from "~typing"

interface QrCodeProps {
  address: HexString
}

export const QrCode: FC<QrCodeProps> = ({ address }) => {
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Refer to:
    // https://github.com/MetaMask/metamask-extension/blob/develop/ui/components/ui/qr-code-view/qr-code-view.tsx#L36-L38
    const data = `${byte.isHex(address) ? "ethereum:" : ""}${address}`

    // Refer to:
    // https://github.com/kozakdenys/qr-code-styling-examples/blob/master/examples/react/src/App.tsx
    const option: Options = {
      type: "svg",
      shape: "square",
      width: 185,
      height: 185,
      data,
      qrOptions: {
        errorCorrectionLevel: "Q"
      },
      dotsOptions: {
        color: "#000000",
        type: "dots"
      },
      backgroundOptions: {
        color: "#ffffff"
      },
      cornersSquareOptions: {
        color: "#000000",
        type: "extra-rounded"
      },
      cornersDotOptions: {
        color: "#000000",
        type: "square"
      }
    }
    const qrCode = new QRCodeStyling(option)
    if (qrRef.current) {
      qrCode.append(qrRef.current)
    }
    if (qrCode) {
      qrCode.update(option)
    }
  }, [address])

  return (
    <div
      className="w-[200px] h-[200px] flex items-center justify-center border-black border-[4px] rounded-[4px]"
      ref={qrRef}
    />
  )
}
