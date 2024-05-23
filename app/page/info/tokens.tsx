import { faCaretDown, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import * as ethers from "ethers"
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"

import { useProviderContext } from "~app/context/provider"
import { useAccount, useAction, useTokens } from "~app/storage"
import { getChainName, getErc20Contract } from "~packages/network/util"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export function Tokens() {
  const tokens = useTokens()
  const account = useAccount()
  const { provider } = useProviderContext()
  const { updateToken } = useAction()
  const explorerUrl = `https://${getChainName(account.chainId)}.etherscan.io/`

  const [isTokenModalOpened, setIsTokenModalOpened] = useState<boolean>(false)
  const toggleAccountModal = () => setIsTokenModalOpened(!isTokenModalOpened)

  useEffect(() => {
    // TODO: In the future, adding an Indexer to the Background Script to
    // monitor Account-related transactions. Updates like balance will trigger
    // as needed, avoiding fixed interval polling with setInterval().
    const updateTokenBalances = async () => {
      tokens.map(async (token) => {
        await updateToken(
          account.id,
          token.address,
          number.toHex(
            token.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
              ? await provider.getBalance(account.address)
              : await getErc20Contract(token.address, provider).balanceOf(
                  account.address
                )
          )
        )
      })
    }

    // Fetch initial balance
    updateTokenBalances().catch((e) =>
      console.warn(`An error occurred while receiving token balance: ${e}`)
    )

    // Periodically check the balance of the account
    const id = setInterval(() => {
      updateTokenBalances().catch((e) =>
        console.warn(`An error occurred while receiving token balance: ${e}`)
      )
    }, 3333) // Every 3.333 seconds

    return () => {
      clearInterval(id)
    }
  }, [account.id])

  return (
    <div>
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        Tokens:
        {tokens.map((token, index) => {
          return (
            <div key={index}>
              <a
                href={`${explorerUrl}token/${token.address}?a=${account.address}`}
                target="_blank">
                {token.symbol}
              </a>{" "}
              {parseFloat(
                ethers.formatUnits(
                  ethers.toBeHex(token.balance),
                  ethers.toNumber(token.decimals)
                )
              ).toFixed(6)}
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
