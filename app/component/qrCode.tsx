import QRCodeStyling, { type Options } from "qr-code-styling"
import { useEffect, useRef, useState, type FC } from "react"

import byte from "~packages/util/byte"
import type { HexString } from "~typing"

interface QrCodeProps {
  address: HexString
  size: number
}

export const QrCode: FC<QrCodeProps> = ({ address, size }) => {
  // Refer to:
  // https://github.com/kozakdenys/qr-code-styling-examples/blob/master/examples/react/src/App.tsx
  const option: Options = {
    type: "svg",
    shape: "square",
    width: size,
    height: size,
    data: generateQrCodeData(address),
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

  const qrRef = useRef<HTMLDivElement>(null)
  const [qrCode] = useState<QRCodeStyling>(new QRCodeStyling(option))

  useEffect(() => {
    if (qrRef.current) {
      qrCode.append(qrRef.current)
    }
  }, [qrCode, qrRef])

  useEffect(() => {
    if (!qrCode) {
      return
    }
    qrCode.update({ ...option, data: generateQrCodeData(address) })
  }, [qrCode, address])

  return (
    <div
      className="flex items-center justify-center border-black border-[4px] rounded-[4px]"
      ref={qrRef}
    />
  )
}

const generateQrCodeData = (address: HexString): string => {
  // Refer to:
  // https://github.com/MetaMask/metamask-extension/blob/develop/ui/components/ui/qr-code-view/qr-code-view.tsx#L36-L38
  return `${byte.isHex(address) ? "ethereum:" : ""}${address}`
}
