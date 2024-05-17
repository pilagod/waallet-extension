import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as ethers from "ethers"
import { useState, type ChangeEvent, type FormEvent } from "react"

import { getChainName } from "~app/page/info/index"
import { useAccount, useAction, useTokens } from "~app/storage"
import type { HexString } from "~typing"

export function Tokens() {
  const tokens = useTokens()
  const account = useAccount()
  const explorerUrl = `https://${getChainName(account.chainId)}.etherscan.io/`

  const [isTokenModalOpened, setIsTokenModalOpened] = useState<boolean>(false)

  const toggleAccountModal = () => setIsTokenModalOpened(!isTokenModalOpened)

  return (
    <div>
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        Tokens:
        {/* TODO: Need to get token addresses from local storage */}
        {tokens &&
          tokens.map((token) => {
            return (
              <div>
                <a
                  href={`${explorerUrl}token/${token.address}`}
                  target="_blank">
                  {`${token.address}`}
                </a>
              </div>
            )
          })}
      </div>
      <div className="col-span-3 cursor-pointer" onClick={toggleAccountModal}>
        <span>Import Tokens</span>
        <FontAwesomeIcon icon={faCaretDown} className="ml-2" />
      </div>
      {isTokenModalOpened && <TokenModal onModalClosed={toggleAccountModal} />}
    </div>
  )
}

function TokenModal(props: { onModalClosed: () => void }) {
  const { importToken } = useAction()
  const account = useAccount()

  const [tokenAddress, setTokenAddress] = useState<HexString>("")
  const [tokenName, setTokenName] = useState<string>("")
  const [tokenSymbol, setTokenSymbol] = useState<string>("")
  const [tokenDecimals, setTokenDecimals] = useState<string>("")
  const [invalidTokenAddress, setInvalidTokenAddress] = useState<boolean>(false)

  const handleTokenAddressChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputTokenAddress = event.target.value
    setTokenAddress(inputTokenAddress)

    try {
      console.log(`${ethers.getAddress(inputTokenAddress)}`)
      setInvalidTokenAddress(false)
    } catch (error) {
      console.log(`[Popup][tokens] Invalid token address`)
      setInvalidTokenAddress(true)
    }
  }

  const onTokenImported = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await importToken(account.id, {
      address: tokenAddress,
      name: tokenName,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      balance: "0x0"
    })

    props.onModalClosed()
  }

  return (
    <div className="absolute top-0 left-0 w-screen h-screen p-4">
      <div
        className="absolute top-0 left-0 w-full h-full bg-black/75"
        onClick={props.onModalClosed}
      />
      <div className="relative w-full p-4 bg-white rounded">
        <div className="absolute top-4 right-4">
          <button onClick={props.onModalClosed}>
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
        <form onSubmit={onTokenImported}>
          <label htmlFor="tokenAddress">Token Address: </label>
          <input
            className={`border w-96 outline-none ${
              invalidTokenAddress ? "border-red-500" : "border-gray-300"
            }`}
            type="text"
            id="tokenAddress"
            value={tokenAddress}
            onChange={handleTokenAddressChange}
          />
          <button type="submit">Import</button>
        </form>
      </div>
    </div>
  )
}
