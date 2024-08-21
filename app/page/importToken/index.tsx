import { useContext, useState } from "react"
import { useHashLocation } from "wouter/use-hash-location"

import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { Input } from "~app/component/input"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { ProviderContext } from "~app/context/provider"
import { ToastContext } from "~app/context/toastContext"
import { useAccount, useAction } from "~app/hook/storage"
import { Path } from "~app/path"
import { ERC20Contract } from "~packages/contract/erc20"
import { Address } from "~packages/primitive"

export function ImportToken() {
  const [, navigate] = useHashLocation()
  const { provider } = useContext(ProviderContext)
  const { setToast } = useContext(ToastContext)

  const { importToken } = useAction()

  const account = useAccount()

  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenDecimals, setTokenDecimals] = useState(0)
  const [tokenBalance, setTokenBalance] = useState(0n)

  const [tokenFetching, setTokenFetching] = useState(false)

  const isTokenValid = tokenSymbol && tokenDecimals > 0

  const onTokenAddressChanged = async (value: string) => {
    setTokenAddress(value)

    // Clear token information
    setTokenSymbol("")
    setTokenDecimals(0)
    setTokenBalance(0n)

    setTokenFetching(true)
    try {
      const contract = await ERC20Contract.init(value, provider)
      const [symbol, decimals, balance] = await Promise.all([
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(account.address)
      ])
      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
      setTokenBalance(balance)
    } finally {
      setTokenFetching(false)
    }
  }

  const importNewToken = async () => {
    // TODO: Custom error to not shown toast when token had already imported.
    await importToken(account.id, {
      address: Address.wrap(tokenAddress),
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      balance: tokenBalance
    })
    setToast(`Token ${tokenSymbol} imported!`, "success")
    navigate(Path.Home)
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
            name="tokenAddress"
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
        {tokenDecimals !== 0 && (
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
            disabled={tokenFetching || !isTokenValid}
            onClick={importNewToken}
          />
        </div>
      </section>
    </>
  )
}
