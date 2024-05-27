import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as ethers from "ethers"
import { useCallback, useState, type ChangeEvent, type FormEvent } from "react"

import { useProviderContext } from "~app/context/provider"
import { useAccount, useAction, useTokens } from "~app/storage"
import { getChainName, getErc20Contract } from "~packages/network/util"
import type { BigNumberish, HexString } from "~typing"

export function Tokens() {
  const tokens = useTokens()

  const [isTokenImportModalOpened, setIsTokenImportModalOpened] =
    useState<boolean>(false)
  const [isTokenInfoModalOpened, setIsTokenInfoModalOpened] =
    useState<boolean>(false)
  const [selectedTokenAddress, setSelectedTokenAddress] =
    useState<HexString>("")

  const toggleTokenImportModal = useCallback(() => {
    setIsTokenImportModalOpened((prev) => !prev)
  }, [])
  const openTokenInfoModal = useCallback((tokenAddress: HexString) => {
    setSelectedTokenAddress(tokenAddress)
    setIsTokenInfoModalOpened(true)
  }, [])
  const closeTokenInfoModal = useCallback(() => {
    setIsTokenInfoModalOpened(false)
  }, [])

  return (
    <div>
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        Tokens:
        {tokens.map((token, index) => {
          return (
            <div key={index}>
              <div
                className="col-span-3 cursor-pointer"
                onClick={() => openTokenInfoModal(token.address)}>
                <span>{token.symbol}</span>{" "}
                <span>
                  {parseFloat(
                    ethers.formatUnits(
                      ethers.toBeHex(token.balance),
                      ethers.toNumber(token.decimals)
                    )
                  ).toFixed(6)}
                </span>
              </div>
              {isTokenInfoModalOpened && (
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
  const token = tokens.find((token) => token.address === tokenAddress)
  const isEth = tokenAddress === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
  const explorerUrl = `https://${getChainName(account.chainId)}.etherscan.io/`
  const tokenExplorerUrl = isEth
    ? `${explorerUrl}address/${account.address}`
    : `${explorerUrl}token/${token.address}?a=${account.address}`

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

  const onTokenInfo = async (event: FormEvent<HTMLFormElement>) => {
    // Prevents the default behavior of the event,
    // allowing for custom handling of the event action.
    event.preventDefault()
    const action = (event.nativeEvent as any).submitter.name

    switch (action) {
      case "update":
        await updateToken(account.id, tokenAddress, token.balance, tokenSymbol)
        onModalClosed()
        break
      case "remove":
        await removeToken(account.id, tokenAddress)
        onModalClosed()
        break
      case "close":
        onModalClosed()
        break
      default:
        console.error("Unknown action")
    }
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
          <span>
            {parseFloat(
              ethers.formatUnits(
                ethers.toBeHex(token.balance),
                ethers.toNumber(token.decimals)
              )
            ).toFixed(6)}
          </span>{" "}
          <span>{token.symbol}</span>
        </div>
        <form onSubmit={onTokenInfo}>
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
            <button type="submit" name="update" disabled={invalidTokenSymbol}>
              Update
            </button>
            <button type="submit" name="remove" hidden={isEth}>
              Remove
            </button>
            <button type="submit" name="close">
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
  const [invalidTokenAddress, setInvalidTokenAddress] = useState<boolean>(true)
  const [invalidTokenAddressMessage, setInvalidTokenAddressMessage] =
    useState<string>("")
  const [invalidTokenSymbol, setInvalidTokenSymbol] = useState<boolean>(true)

  const handleTokenAddressChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const inputTokenAddress = event.target.value
    setTokenAddress(inputTokenAddress)

    if (
      tokens.some(
        (token) =>
          token.address.toLowerCase() === inputTokenAddress.toLowerCase()
      )
    ) {
      setInvalidTokenAddress(true)
      setInvalidTokenAddressMessage("Token address already exists")
      return
    }

    const erc20 = getErc20Contract(inputTokenAddress, provider)

    try {
      console.log(`${ethers.getAddress(inputTokenAddress)}`)
      const symbol: string = await erc20.symbol()
      const decimals: number = ethers.toNumber(await erc20.decimals())
      setInvalidTokenAddress(false)
      setInvalidTokenAddressMessage("")
      setInvalidTokenSymbol(false)
      setTokenSymbol(symbol)
      setTokenDecimals(decimals)
    } catch (error) {
      console.warn(`[Popup][tokens] Invalid token address: ${error}`)
      setInvalidTokenAddress(true)
      setInvalidTokenAddressMessage("Invalid token address")
      setInvalidTokenSymbol(true)
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
            <label htmlFor="tokenAddress">Token Address:</label>
            <input
              className={`border w-96 outline-none ${
                tokenAddress && invalidTokenAddress
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
          {!invalidTokenAddress && (
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
