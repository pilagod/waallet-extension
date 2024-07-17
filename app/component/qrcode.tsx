import QRCodeStyling from "qr-code-styling"
import { useEffect, useRef, type FC } from "react"

interface QrCodeProps {
  address: string
}

export const QrCode: FC<QrCodeProps> = ({ address }) => {
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    qrCode.append(qrRef.current)
  }, [])

  const qrCode = new QRCodeStyling({
    type: "svg",
    shape: "square",
    width: 185,
    height: 185,
    data: address,
    qrOptions: {
      errorCorrectionLevel: "H"
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
  })
  return (
    <div
      className="w-[200px] h-[200px] flex items-center justify-center border-black border-[4px] rounded-[4px]"
      ref={qrRef}
    />
  )
}
