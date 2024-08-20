import { useHashLocation } from "wouter/use-hash-location"

import { Button } from "~app/component/button"
import { ScrollableWrapper } from "~app/component/scrollableWrapper"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { useTokens } from "~app/hook/storage"
import { Path } from "~app/path"

export function Token() {
  const [, navigate] = useHashLocation()

  const tokens = useTokens()

  return (
    <ScrollableWrapper className="h-[270px]">
      <TokenList>
        {tokens.map((token, index) => (
          <button
            className="w-full px-[16px] hover:bg-[#F5F5F5] cursor-pointer"
            key={index}
            onClick={() => navigate(`${Path.Send}/${token.address}`)}>
            <TokenItem token={token} />
          </button>
        ))}

        {/* Import Token Button */}
        <div className="mx-auto my-[20px] text-[18px]">
          <Button
            text="Import token"
            variant="white"
            className="px-[24px] !font-[600]"
            onClick={() => navigate(Path.ImportToken)}
          />
        </div>
      </TokenList>
    </ScrollableWrapper>
  )
}
