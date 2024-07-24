import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { getAddress } from "ethers"
import { useContext, useState, type ChangeEvent } from "react"
import { useHashLocation } from "wouter/use-hash-location"

import { ERC20Contract } from "~/packages/contract/erc20"
import { TokenItem } from "~app/component/tokenItem"
import { TokenList } from "~app/component/tokenList"
import { ProviderContext } from "~app/context/provider"
import { ToastContext } from "~app/context/toastContext"
import { Path } from "~app/path"
import { useAccount, useAction, useTokens } from "~app/storage"
import { getUserTokens } from "~app/util/getUserTokens"
import { getChainName } from "~packages/network/util"
import address from "~packages/util/address"
import number from "~packages/util/number"
import { type AccountToken } from "~storage/local/state"
import type { BigNumberish, HexString, Nullable } from "~typing"

export function Token() {
  const [isTokenImportModalOpened, setIsTokenImportModalOpened] =
    useState<boolean>(false)

  const [tokenSelected, setTokenSelected] =
    useState<Nullable<AccountToken>>(null)

  const toggleTokenImportModal = () => {
    setIsTokenImportModalOpened((prev) => !prev)
  }
  const openTokenInfoModal = (token: AccountToken) => {
    setTokenSelected(token)
  }
  const closeTokenInfoModal = () => {
    setTokenSelected(null)
  }
  const tokens = getUserTokens()

  return (
    <TokenList>
      {tokens.map((token, index) => (
        <button
          className="w-full"
          key={index}
          onClick={() => openTokenInfoModal(token)}>
          <TokenItem token={token} />
        </button>
      ))}
      {/* Token information modal */}
      {tokenSelected && (
        <TokenInfoModal
          onModalClosed={closeTokenInfoModal}
          tokenSelected={tokenSelected}
        />
      )}
      {/* Token importing button */}
      <div
        className="col-span-3 cursor-pointer"
        onClick={toggleTokenImportModal}>
        <span>Import Tokens</span>
        <FontAwesomeIcon icon={faCaretDown} className="ml-2" />
      </div>
      {/* Token importing modal */}
      {isTokenImportModalOpened && (
        <TokenImportModal onModalClosed={toggleTokenImportModal} />
      )}
    </TokenList>
  )
}

function TokenInfoModal({
  onModalClosed,
  tokenSelected
}: {
  onModalClosed: () => void
  tokenSelected: AccountToken
}) {
  const { updateToken, removeToken } = useAction()
  const account = useAccount()

  const explorerUrl = `https://${getChainName(account.chainId)}.etherscan.io/`
  const tokenExplorerUrl = `${explorerUrl}token/${tokenSelected.address}?a=${account.address}`

  const [tokenSymbol, setTokenSymbol] = useState<string>(tokenSelected.symbol)
  const [invalidTokenSymbol, setInvalidTokenSymbol] = useState<boolean>(false)
  const [isViewExplorerVisible, setIsViewExplorerVisible] = useState(false)

  const toggleViewExplorerVisibility = () => {
    setIsViewExplorerVisible((prev) => !prev)
  }

  const handleTokenSymbolChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputTokenSymbol = event.target.value
    setTokenSymbol(inputTokenSymbol)
    setInvalidTokenSymbol(inputTokenSymbol.length === 0)
  }

  const handleUpdate = async () => {
    await updateToken(account.id, tokenSelected.address, {
      balance: tokenSelected.balance,
      symbol: tokenSymbol
    })
    onModalClosed()
  }

  const handleRemove = async () => {
    await removeToken(account.id, tokenSelected.address)
    onModalClosed()
  }

  const handleClose = () => {
    onModalClosed()
  }
  const [, navigate] = useHashLocation()

  const handleSend = () => {
    navigate(`${Path.Send}/${tokenSelected.address}`)
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
          <span>{tokenSelected.symbol}</span>
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
            {number.formatUnitsToFixed(
              tokenSelected.balance,
              tokenSelected.decimals
            )}
          </span>
          <span>{tokenSelected.symbol}</span>
        </div>
        <div>
          <label htmlFor="tokenAddress">Token Address:</label>
          <input
            className="border w-96 outline-none border-gray-300"
            type="text"
            id="tokenAddress"
            value={tokenSelected.address}
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
            value={tokenSelected.decimals}
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
          <button type="button" onClick={handleSend}>
            Send
          </button>
          <button type="button" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function TokenImportModal({ onModalClosed }: { onModalClosed: () => void }) {
  const { provider } = useContext(ProviderContext)
  const { importToken } = useAction()
  const tokens = useTokens()
  const account = useAccount()

  const [tokenAddress, setTokenAddress] = useState<HexString>("")
  const [tokenSymbol, setTokenSymbol] = useState<string>("")
  const [tokenDecimals, setTokenDecimals] = useState<number>(0)
  const [invalidTokenAddressMessage, setInvalidTokenAddressMessage] =
    useState<string>("")
  const [invalidTokenSymbol, setInvalidTokenSymbol] = useState<boolean>(true)
  const { setToast } = useContext(ToastContext)

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

    try {
      const erc20 = await ERC20Contract.init(inputTokenAddress, provider)
      const symbol = await erc20.symbol()
      const decimals = await erc20.decimals()
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

  const onTokenImported = async () => {
    let balance: BigNumberish = 0
    try {
      const token = await ERC20Contract.init(tokenAddress, provider)
      balance = await token.balanceOf(account.address)
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
    setToast("Token imported!", "success")
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
            <button
              type="button"
              onClick={onTokenImported}
              disabled={invalidTokenSymbol}>
              Import
            </button>
          </>
        )}
      </div>
    </div>
  )
}
