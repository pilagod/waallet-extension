import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { formatUnits, getAddress, toNumber } from "ethers"
import { useCallback, useState, type ChangeEvent, type FormEvent } from "react"

import { useProviderContext } from "~app/context/provider"
import { useAccount, useAction, useTokens } from "~app/storage"
import { getChainName, getErc20Contract } from "~packages/network/util"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export function Tokens() {
  const tokens = useTokens()
  const account = useAccount()

  const [isTokenImportModalOpened, setIsTokenImportModalOpened] =
    useState<boolean>(false)
  const [selectedTokenAddress, setSelectedTokenAddress] =
    useState<HexString>("")

  const toggleTokenImportModal = useCallback(() => {
    setIsTokenImportModalOpened((prev) => !prev)
  }, [])
  const openTokenInfoModal = useCallback((tokenAddress: HexString) => {
    setSelectedTokenAddress(tokenAddress)
  }, [])
  const closeTokenInfoModal = useCallback(() => {
    setSelectedTokenAddress("")
  }, [])

  return (
    <div>
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        Tokens:
        <div>
          <span>{getChainName(account.chainId)}ETH </span>
          <span>{formatUnitsToFixed(account.balance, 18)}</span>
        </div>
        {tokens.map((token, index) => {
          return (
            <div key={index}>
              <div
                className="col-span-3 cursor-pointer"
                onClick={() => openTokenInfoModal(token.address)}>
                <span>{token.symbol}</span>{" "}
                <span>{formatUnitsToFixed(token.balance, token.decimals)}</span>
              </div>
              {selectedTokenAddress && (
                <TokenInfoModal
                  onModalClosed={closeTokenInfoModal}
                  tokenAddress={selectedTokenAddress}
                />
              )}
            </div>
          )
        })}
      </div>
      <div
        className="col-span-3 cursor-pointer"
        onClick={toggleTokenImportModal}>
        <span>Import Tokens</span>
        <FontAwesomeIcon icon={faCaretDown} className="ml-2" />
      </div>
      {isTokenImportModalOpened && (
        <TokenImportModal onModalClosed={toggleTokenImportModal} />
      )}
    </div>
  )
}

function TokenInfoModal({
  onModalClosed,
  tokenAddress
}: {
  onModalClosed: () => void
  tokenAddress: HexString
}) {
  const { updateToken, removeToken } = useAction()
  const account = useAccount()
  const tokens = useTokens()
  const token = tokens.find((token) =>
    address.isEqual(token.address, tokenAddress)
  )

  const explorerUrl = `https://${getChainName(account.chainId)}.etherscan.io/`
  const tokenExplorerUrl = `${explorerUrl}token/${token.address}?a=${account.address}`

  const [tokenSymbol, setTokenSymbol] = useState<string>(token.symbol)
  const [invalidTokenSymbol, setInvalidTokenSymbol] = useState<boolean>(false)
  const [isViewExplorerVisible, setIsViewExplorerVisible] = useState(false)

  const toggleViewExplorerVisibility = useCallback(() => {
    setIsViewExplorerVisible((prev) => !prev)
  }, [])

  const handleTokenSymbolChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputTokenSymbol = event.target.value
    setTokenSymbol(inputTokenSymbol)
    setInvalidTokenSymbol(inputTokenSymbol.length === 0)
  }

  const handleUpdate = async () => {
    await updateToken(account.id, tokenAddress, {
      balance: token.balance,
      symbol: tokenSymbol
    })
    onModalClosed()
  }

  const handleRemove = async () => {
    await removeToken(account.id, tokenAddress)
    onModalClosed()
  }

  const handleClose = () => {
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
        <div>
          <span>{token.symbol}</span>
          <button onClick={toggleViewExplorerVisibility} className="ml-2">
            ...
          </button>
          {isViewExplorerVisible && (
            <div className="absolute left-0 bg-white border border-gray-300 p-4 rounded shadow">
              <a href={tokenExplorerUrl} target="_blank">
                View Asset in explorer
              </a>
            </div>
          )}
        </div>
        <div className="text-center">
          <span>{formatUnitsToFixed(token.balance, token.decimals)}</span>{" "}
          <span>{token.symbol}</span>
        </div>
        <form>
          <div>
            <label htmlFor="tokenAddress">Token Address:</label>
            <input
              className="border w-96 outline-none border-gray-300"
              type="text"
              id="tokenAddress"
              value={tokenAddress}
              disabled={true}
            />
          </div>
          <div>
            <label htmlFor="tokenSymbol">Token Symbol:</label>
            <input
              className={`border w-96 outline-none ${
                invalidTokenSymbol ? "border-red-500" : "border-gray-300"
              }`}
              type="text"
              id="tokenSymbol"
              value={tokenSymbol}
              onChange={handleTokenSymbolChange}
            />
          </div>
          <div>
            <label htmlFor="tokenDecimals">Token Decimals:</label>
            <input
              className="border w-96 outline-none border-gray-300"
              type="text"
              id="tokenDecimals"
              value={token.decimals}
              disabled={true}
            />
          </div>
          <div className="w-full grid grid-cols-5 justify-items-center my-4 text-base">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={invalidTokenSymbol}>
              Update
            </button>
            <button type="button" onClick={handleRemove}>
              Remove
            </button>
            <button type="button" onClick={handleClose}>
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TokenImportModal({ onModalClosed }: { onModalClosed: () => void }) {
  const { provider } = useProviderContext()
  const { importToken } = useAction()
  const tokens = useTokens()
  const account = useAccount()

  const [tokenAddress, setTokenAddress] = useState<HexString>("")
  const [tokenSymbol, setTokenSymbol] = useState<string>("")
  const [tokenDecimals, setTokenDecimals] = useState<number>(0)
  const [invalidTokenAddressMessage, setInvalidTokenAddressMessage] =
    useState<string>("")
  const [invalidTokenSymbol, setInvalidTokenSymbol] = useState<boolean>(true)

  const handleTokenAddressChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const inputTokenAddress = event.target.value
    setTokenAddress(inputTokenAddress)

    try {
      console.log(`${getAddress(inputTokenAddress)}`)
      setInvalidTokenAddressMessage("")
    } catch (error) {
      console.warn(`[Popup][tokens] Invalid token address: ${error}`)
      setInvalidTokenAddressMessage("Invalid token address")
      return
    }

    if (
      tokens.some((token) => address.isEqual(token.address, inputTokenAddress))
    ) {
      setInvalidTokenAddressMessage("Token address already exists")
      return
    }

    const erc20 = getErc20Contract(inputTokenAddress, provider)

    try {
      const symbol: string = await erc20.symbol()
      const decimals: number = toNumber(await erc20.decimals())
      setInvalidTokenAddressMessage("")
      setInvalidTokenSymbol(false)
      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
    } catch (error) {
      console.warn(`[Popup][tokens] Invalid token symbol or decimals: ${error}`)
      setInvalidTokenAddressMessage("Address is not an ERC20 token")
      setInvalidTokenSymbol(true)
      setTokenSymbol("")
      setTokenDecimals(0)
      return
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

    let balance: BigNumberish = 0
    try {
      balance = await getErc20Contract(tokenAddress, provider).balanceOf(
        account.address
      )
    } catch (error) {
      console.warn(
        `[Popup][tokens] error occurred while getting balance: ${error}`
      )
    }
    await importToken(account.id, {
      address: tokenAddress,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      balance: number.toHex(balance)
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
            <label htmlFor="tokenAddress">Token Address:</label>
            <input
              className={`border w-96 outline-none ${
                tokenAddress.length > 0 && invalidTokenAddressMessage
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              type="text"
              id="tokenAddress"
              value={tokenAddress}
              onChange={handleTokenAddressChange}
            />
          </div>
          {invalidTokenAddressMessage && (
            <div className="text-red-500">{invalidTokenAddressMessage}</div>
          )}
          {tokenAddress.length > 0 && !invalidTokenAddressMessage && (
            <>
              <div>
                <label htmlFor="tokenSymbol">Token Symbol:</label>
                <input
                  className={`border w-96 outline-none ${
                    invalidTokenSymbol ? "border-red-500" : "border-gray-300"
                  }`}
                  type="text"
                  id="tokenSymbol"
                  value={tokenSymbol}
                  onChange={handleTokenSymbolChange}
                />
              </div>
              <div>
                <label htmlFor="tokenDecimals">Token Decimals:</label>
                <input
                  className="border w-96 outline-none border-gray-300"
                  type="text"
                  id="tokenDecimals"
                  value={tokenDecimals}
                  disabled={true}
                />
              </div>
              <button type="submit" disabled={invalidTokenSymbol}>
                Import
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

function formatUnitsToFixed(
  balance: BigNumberish,
  decimals: BigNumberish,
  fixed: number = 6
): string {
  const parseValue = parseFloat(formatUnits(balance, toNumber(decimals)))
  if (isNaN(parseValue) || parseValue === 0) {
    return "0"
  }
  return parseValue.toFixed(fixed)
}
