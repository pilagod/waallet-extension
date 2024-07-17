import Ethereum from "react:~assets/ethereum.svg"

import number from "~packages/util/number"
import type { Token } from "~storage/local/state"

export const TokenItem = ({
  token,
  onClick
}: {
  token: Token
  onClick: () => void
}) => {
  return (
    <button className="w-full" onClick={onClick}>
      <div className="flex items-center py-[17px]">
        <Ethereum className="w-[36px] h-[36px] mr-[12px]" />
        <div className="flex-grow text-[20px] text-[#000000] text-left whitespace-nowrap">
          {token.symbol}
        </div>
        <div className="flex flex-col items-end">
          <div className="mb-[4px] text-[20px] font-[600] text-[#000000]">
            {number.formatUnitsToFixed(token.balance, token.decimals, 2)}
          </div>
          {/* // TODO: add price oracle */}
          <div className="text-[12px] text-[#000000]">$1.23</div>
        </div>
      </div>
    </button>
  )
}
