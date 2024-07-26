import { useHashLocation } from "wouter/use-hash-location"

import { Button } from "~app/component/button"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { Path } from "~app/path"
import { getUserTokens } from "~app/util/getUserTokens"

export function Token() {
  const [, navigate] = useHashLocation()

  const tokens = getUserTokens()

  return (
    <TokenList>
      {tokens.map((token, index) => (
        <div className="w-full" key={index}>
          <TokenItem token={token} />
        </div>
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
  )
}
