import * as ethers from "ethers"
import { useContext, useEffect, useState, type MouseEvent } from "react"

import { ProviderCtx } from "~popup/ctx/provider"
import type { BigNumberish, HexString } from "~typing"

import "~style.css"

export function Info() {
  const providerCtx = useContext(ProviderCtx)

  const [address, setAddress] = useState<HexString>("")
  const [balance, setBalance] = useState<BigNumberish>(0n)
  const [transactionHashes, setTransactionHashes] = useState<HexString[]>([""])
  const [internalTransactionHashes, setInternalTransactionHashes] = useState<
    HexString[]
  >([""])
  const [explorerUrl, setExplorerUrl] = useState<string>("")

  useEffect(() => {
    console.log(`providerCtx: ${providerCtx.provider}, ${providerCtx.index}`)

    const asyncFn = async () => {
      if (!providerCtx.provider) return

      const explorer = getExplorerUrl(
        (await providerCtx.provider.getNetwork()).name
      )
      setExplorerUrl(explorer)

      const addresses = (await providerCtx.provider.listAccounts()).map(
        (account) => account.address
      )
      setAddress(addresses[providerCtx.index])

      const balances = await Promise.all(
        addresses.map(async (account) => {
          return await providerCtx.provider.getBalance(account)
        })
      )
      setBalance(balances[providerCtx.index])

      const txHashes = await accountTransactions(
        explorer,
        addresses[providerCtx.index]
      )
      setTransactionHashes(txHashes)

      const internalTxHashes = await accountInternalTransactions(
        explorer,
        addresses[providerCtx.index]
      )
      setInternalTransactionHashes(internalTxHashes)
    }

    asyncFn()
  }, [providerCtx.index, providerCtx.provider])

  return (
    <>
      {address && (
        <AccountAddress account={address} explorerUrl={explorerUrl} />
      )}
      {balance && <AccountBalance balance={balance} />}
      {transactionHashes && (
        <AccountTransactions
          explorerUrl={explorerUrl}
          hashes={transactionHashes}
        />
      )}
      {internalTransactionHashes && (
        <AccountInternalTransactions
          explorerUrl={explorerUrl}
          hashes={internalTransactionHashes}
        />
      )}
    </>
  )
}

const AccountAddress: React.FC<{
  account: HexString
  explorerUrl: string
}> = ({ account, explorerUrl }) => {
  return (
    <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <button
        onClick={handleClick}
        data-url={`${explorerUrl}address/${account}#code`}>
        {`${account}`}
      </button>
    </div>
  )
}

const AccountBalance: React.FC<{ balance: BigNumberish }> = ({ balance }) => {
  return (
    <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <span>${ethers.formatEther(balance)}</span>
    </div>
  )
}

const AccountTransactions: React.FC<{
  hashes: HexString[]
  explorerUrl: string
}> = ({ hashes, explorerUrl }) => {
  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <div>Transactions</div>
      {hashes.map((hash, i, _) => (
        <button
          key={i} // Prevent the "Each child in a list should have a unique 'key' prop" warning."
          onClick={handleClick}
          data-url={`${explorerUrl}tx/${hash}`}>
          {`${hash}`}
        </button>
      ))}
    </div>
  )
}

const AccountInternalTransactions: React.FC<{
  hashes: HexString[]
  explorerUrl: string
}> = ({ hashes, explorerUrl }) => {
  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <div>Internal Transactions</div>
      {hashes.map((hash, i, _) => (
        <button
          key={i} // Prevent the "Each child in a list should have a unique 'key' prop" warning."
          onClick={handleClick}
          data-url={`${explorerUrl}tx/${hash}`}>
          {`${hash}`}
        </button>
      ))}
    </div>
  )
}

const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
  const url = event.currentTarget.getAttribute("data-url")

  if (url) {
    chrome.tabs.create({ url })
  }
}

enum transactionType {
  normal = "normal",
  internal = "internal"
}

const accountTransactions = async (
  explorerUrl: string,
  address: HexString
): Promise<string[]> => {
  return transactionsCrawler(
    transactionType.normal,
    `${explorerUrl}address/${address}`
  )
}

const accountInternalTransactions = async (
  explorerUrl: string,
  address: HexString
): Promise<string[]> => {
  return transactionsCrawler(
    transactionType.internal,
    `${explorerUrl}address/${address}#internaltx`
  )
}

const transactionsCrawler = async (type: transactionType, url: string) => {
  try {
    const response = await fetch(url)
    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, "text/html")

    let transactionXpath = ""
    let blockXpath = ""
    let dateXpath = ""

    if (type === transactionType.internal) {
      transactionXpath =
        "/html/body/main/section[2]/div[4]/div[2]/div/div[2]/table/tbody/tr/td[1]/div/a"
      blockXpath =
        "/html/body/main/section[2]/div[4]/div[2]/div/div[2]/table/tbody/tr/td[2]/a"
      dateXpath =
        "/html/body/main/section[2]/div[4]/div[2]/div/div[2]/table/tbody/tr/td[4]/span"
    }
    if (type === transactionType.normal) {
      transactionXpath =
        "/html/body/main/section[2]/div[4]/div[1]/div/div[2]/table/tbody/tr/td[2]/div/a"
      blockXpath =
        "/html/body/main/section[2]/div[4]/div[1]/div/div[2]/table/tbody/tr/td[4]/a"
      dateXpath =
        "/html/body/main/section[2]/div[4]/div[1]/div/div[2]/table/tbody/tr/td[6]/span"
    }

    const transactionNodes = doc.evaluate(
      transactionXpath,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
    const blockNodes = doc.evaluate(
      blockXpath,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
    const dateNodes = doc.evaluate(
      dateXpath,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )

    const hashes: HexString[] = []
    const blocksSet: Set<number> = new Set()
    const dates: Date[] = []

    for (let i = 0; i < transactionNodes.snapshotLength; i++) {
      const hash = transactionNodes.snapshotItem(i).textContent.trim()
      const blockNumber = parseInt(
        blockNodes.snapshotItem(i).textContent.trim(),
        10
      )
      const dateString =
        (dateNodes.snapshotItem(i) as Element)?.getAttribute("data-bs-title") ||
        ""
      if (!blocksSet.has(blockNumber)) {
        hashes.push(hash)
        blocksSet.add(isNaN(blockNumber) ? 0 : blockNumber)
        dates.push(new Date(dateString))
      }
    }

    const blocks: number[] = [...blocksSet]

    console.log(
      `hashes: ${JSON.stringify(hashes, null, 2)}\nblocks: ${JSON.stringify(
        blocks,
        null,
        2
      )}`
    )

    return Promise.resolve(hashes)
  } catch (error) {
    console.error("Error fetching transaction data:", error)
    return Promise.reject("Error fetching transaction data")
  }
}

const getExplorerUrl = (chain: string | number): string => {
  const net = typeof chain === "string" ? chain.toLowerCase() : chain
  let explorerUrl: string
  switch (net) {
    case "mainnet":
    case 1:
      explorerUrl = "https://etherscan.io/"
      break
    case "goerli":
    case 5:
      explorerUrl = "https://goerli.etherscan.io/"
      break
    case "sepolia":
    case 11155111:
      explorerUrl = "https://sepolia.etherscan.io/"
      break
    case "holesky":
    case 17000:
      explorerUrl = "https://holesky.etherscan.io/"
      break
    default:
      explorerUrl = null
  }
  return explorerUrl
}
