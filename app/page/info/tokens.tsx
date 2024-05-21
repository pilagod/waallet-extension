import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as ethers from "ethers"
import { useState, type ChangeEvent, type FormEvent } from "react"

import { useProviderContext } from "~app/context/provider"
import { useAccount, useAction, useTokens } from "~app/storage"
import { getChainName } from "~packages/network/util/chain"
import type { BigNumberish, HexString } from "~typing"

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
        {tokens &&
          tokens.map((token, index) => {
            return (
              <div key={index}>
                <a
                  href={`${explorerUrl}token/${token.address}`}
                  target="_blank">
                  {`${token.symbol}`}
                </a>
                {` ${parseFloat(
                  ethers.formatUnits(
                    ethers.toBeHex(token.balance),
                    ethers.toNumber(token.decimals)
                  )
                ).toFixed(6)}`}
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

function TokenModal({ onModalClosed }: { onModalClosed: () => void }) {
  const { provider } = useProviderContext()
  const { importToken } = useAction()
  const account = useAccount()

  const [tokenAddress, setTokenAddress] = useState<HexString>("")
  const [tokenSymbol, setTokenSymbol] = useState<string>("")
  const [tokenDecimals, setTokenDecimals] = useState<number>(0)
  const [invalidTokenAddress, setInvalidTokenAddress] = useState<boolean>(true)
  const [invalidTokenSymbol, setInvalidTokenSymbol] = useState<boolean>(false)

  const handleTokenAddressChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const inputTokenAddress = event.target.value
    setTokenAddress(inputTokenAddress)
    const erc20 = getErc20Contract(inputTokenAddress, provider)

    try {
      console.log(`${ethers.getAddress(inputTokenAddress)}`)
      const symbol: string = await erc20.symbol()
      const decimals: number = ethers.toNumber(await erc20.decimals())
      setInvalidTokenAddress(false)
      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
    } catch (error) {
      console.warn(`[Popup][tokens] Invalid token address: ${error}`)
      setInvalidTokenAddress(true)
      setTokenSymbol("")
      setTokenDecimals(0)
    }
  }

  const handleTokenSymbolChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputTokenSymbol = event.target.value
    setTokenSymbol(inputTokenSymbol)
    setInvalidTokenSymbol(inputTokenSymbol.length === 0)
  }

  const onTokenImported = async (event: FormEvent<HTMLFormElement>) => {
    // Prevents the default behavior of the event,
    // allowing for custom handling of the event action.
    event.preventDefault()

    let balance: BigNumberish
    try {
      balance = await getErc20Contract(tokenAddress, provider).balanceOf(
        account.address
      )
    } catch (error) {
      console.warn(
        `[Popup][tokens] error occurred while getting balance: ${error}`
      )
      balance = 0
    }
    await importToken(account.id, {
      address: tokenAddress,
      symbol: tokenSymbol,
      decimals: ethers.toBeHex(tokenDecimals),
      balance: ethers.toBeHex(balance)
    })
    onModalClosed()
  }

  return (
    <div className="absolute top-0 left-0 w-screen h-screen p-4">
      <div
        className="absolute top-0 left-0 w-full h-full bg-black/75"
        onClick={onModalClosed}
      />
      <div className="relative w-full p-4 bg-white rounded">
        <div className="absolute top-4 right-4">
          <button onClick={onModalClosed}>
            <FontAwesomeIcon icon={faXmark} className="text-lg" />
          </button>
        </div>
        <form onSubmit={onTokenImported}>
          <div>
            <label className="" htmlFor="tokenAddress">
              Token Address:
            </label>
            <input
              className={`border w-96 outline-none ${
                invalidTokenAddress ? "border-red-500" : "border-gray-300"
              }`}
              type="text"
              id="tokenAddress"
              value={tokenAddress}
              onChange={handleTokenAddressChange}
            />
          </div>
          <div>
            <label htmlFor="tokenSymbol" hidden={invalidTokenAddress}>
              Token Symbol:
            </label>
            <input
              className={`border w-96 outline-none ${
                invalidTokenSymbol ? "border-red-500" : "border-gray-300"
              }`}
              type="text"
              id="tokenSymbol"
              value={tokenSymbol}
              hidden={invalidTokenAddress}
              onChange={handleTokenSymbolChange}
            />
          </div>
          <div>
            <label htmlFor="tokenDecimals" hidden={invalidTokenAddress}>
              Token Decimals:
            </label>
            <input
              className="border w-96 outline-none border-gray-300"
              type="text"
              id="tokenDecimals"
              value={tokenDecimals}
              hidden={invalidTokenAddress}
            />
          </div>
          <button
            type="submit"
            disabled={invalidTokenAddress || invalidTokenSymbol}>
            Import
          </button>
        </form>
      </div>
    </div>
  )
}

const getErc20Contract = (
  address: HexString,
  runner: ethers.ContractRunner
) => {
  return new ethers.Contract(
    address,
    [
      "function balanceOf(address account) external view returns (uint256)",
      "function name() public view returns (string)",
      "function symbol() public view returns (string)",
      "function decimals() public view returns (uint8)"
    ],
    runner
  )
}
