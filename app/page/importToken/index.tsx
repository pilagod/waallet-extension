import { useContext, useState } from "react"

import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { Input } from "~app/component/input"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { ProviderContext } from "~app/context/provider"
import { useTokens } from "~app/hook/storage"
import { getErc20Contract } from "~packages/network/util"
import address from "~packages/util/address"

export function ImportToken() {
  const { provider } = useContext(ProviderContext)

  const tokens = useTokens()

  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenDecimals, setTokenDecimals] = useState(0n)
  const [tokenFetching, setTokenFetching] = useState(false)
  const [tokenAddressValid, setTokenAddressValid] = useState(false)

  const onTokenAddressChanged = async (value: string) => {
    setTokenAddress(value)

    // Clear token information
    setTokenSymbol("")
    setTokenDecimals(0n)

    if (tokens.some((t) => address.isEqual(t.address, value))) {
      setTokenAddressValid(false)
      return
    }

    setTokenFetching(true)
    try {
      const contract = getErc20Contract(value, provider)
      const [symbol, decimals] = await Promise.all([
        contract.symbol() as Promise<string>,
        contract.decimals() as Promise<bigint>
      ])
      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
      setTokenAddressValid(true)
    } catch (e) {
      setTokenAddressValid(false)
    } finally {
      setTokenFetching(false)
    }
  }

  return (
    <>
      <StepBackHeader title="Import Token" />

      {/* Token Information */}
      <section className="h-[373px] pt-[24px]">
        {/* Token Contract Address */}
        <div>
          <Input
            label="Contract Address"
            value={tokenAddress}
            onValueChanged={onTokenAddressChanged}
            placeholder="Enter contract address"
            required={true}
          />
        </div>

        {/* Token Symbol */}
        {tokenSymbol && (
          <div className="mt-[16px]">
            <Input label="Symbol" value={tokenSymbol} disabled={true} />
          </div>
        )}

        {/* Token Decimals */}
        {tokenDecimals && (
          <div className="mt-[16px]">
            <Input
              label="Decimals"
              value={tokenDecimals.toString()}
              disabled={true}
            />
          </div>
        )}
      </section>

      <Divider />

      {/* Import Token Button */}
      <section className="py-[22.5px]">
        <div className="text-[18px]">
          <Button
            text="Import token"
            variant="black"
            disabled={tokenFetching || !tokenAddressValid}
          />
        </div>
      </section>
    </>
  )
}