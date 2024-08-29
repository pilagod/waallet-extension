import QRCodeStyling, { type Options } from "qr-code-styling"
import { useEffect, useRef, useState, type FC } from "react"

interface QrCodeProps {
  data: string
  size: number
}

export const QrCode: FC<QrCodeProps> = ({ data, size }) => {
  // Refer to:
  // https://github.com/kozakdenys/qr-code-styling-examples/blob/master/examples/react/src/App.tsx
  const option: Options = {
    type: "svg",
    shape: "square",
    width: size,
    height: size,
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
    qrCode.update({ ...option, data })
  }, [qrCode, data])

  return (
    <div
      className="flex items-center justify-center border-black border-[4px] rounded-[4px]"
      ref={qrRef}
    />
  )
}
