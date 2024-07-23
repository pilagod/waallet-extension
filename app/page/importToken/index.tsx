import { useContext, useState, type ChangeEvent } from "react"

import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
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

  const onTokenAddressChanged = async (e: ChangeEvent<HTMLInputElement>) => {
    const inputAddress = e.target.value
    setTokenAddress(inputAddress)

    // Clear token information
    setTokenSymbol("")
    setTokenDecimals(0n)

    if (tokens.some((t) => address.isEqual(t.address, inputAddress))) {
      setTokenAddressValid(false)
      return
    }

    setTokenFetching(true)
    try {
      const contract = getErc20Contract(inputAddress, provider)
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
          <div className="text-[16px]">Contract Address</div>
          <div className="mt-[8px]">
            <input
              type="text"
              value={tokenAddress}
              onChange={onTokenAddressChanged}
              className="w-full border-solid border-black border-[2px] rounded-[16px] p-[16px] text-[16px]"
              placeholder="Enter contract address"
              required
            />
          </div>
        </div>

        {/* Token Symbol */}
        {tokenSymbol && (
          <div className="mt-[8px]">
            <div className="text-[16px]">Symbol</div>
            <div className="mt-[8px]">
              <input
                type="text"
                value={tokenSymbol}
                disabled={true}
                className="w-full border-solid border-black border-[2px] rounded-[16px] p-[16px] text-[16px]"
              />
            </div>
          </div>
        )}

        {/* Token Decimals */}
        {tokenDecimals && (
          <div className="mt-[8px]">
            <div className="text-[16px]">Decimals</div>
            <div className="mt-[8px]">
              <input
                type="text"
                value={tokenDecimals.toString()}
                disabled={true}
                className="w-full border-solid border-black border-[2px] rounded-[16px] p-[16px] text-[16px]"
              />
            </div>
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
