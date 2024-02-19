import * as ethers from "ethers"
import { useContext, useEffect, useState, type MouseEvent } from "react"

import { ProviderCtx } from "~popup/ctx/provider"

import "~style.css"

export function Info() {
  const providerCtx = useContext(ProviderCtx)

  const [accounts, setAccounts] = useState<string[]>([""])
  const [balances, setBalances] = useState<bigint[]>([0n])
  const [transactionHashes, setTransactionHashes] = useState<string[]>([""])
  const [internalTransactionHashes, setInternalTransactionHashes] = useState<
    string[]
  >([""])
  const [explorerUrl, setExplorerUrl] = useState<string>("")

  useEffect(() => {
    console.log(`providerCtx: ${providerCtx.provider}, ${providerCtx.index}`)

    const asyncFn = async () => {
      if (!providerCtx.provider) return

      const _explorerUrl = getExplorerUrl(
        (await providerCtx.provider.getNetwork()).name
      )
      setExplorerUrl(_explorerUrl)

      const _accounts = (await providerCtx.provider.listAccounts()).map(
        (account) => account.address
      )
      setAccounts(_accounts)

      const _balances = await Promise.all(
        _accounts.map(async (account) => {
          return await providerCtx.provider.getBalance(account)
        })
      )
      setBalances(_balances)

      const _transactionHashes = await accountTransactions(
        _explorerUrl,
        _accounts[providerCtx.index]
      )
      setTransactionHashes(_transactionHashes)

      const _internalTransactionHashes = await accountInternalTransactions(
        _explorerUrl,
        _accounts[providerCtx.index]
      )
      setInternalTransactionHashes(_internalTransactionHashes)
    }

    asyncFn()
  }, [providerCtx.index, providerCtx.provider])

  return (
    <>
      <AccountAddress
        accounts={accounts}
        explorerUrl={explorerUrl}
        index={providerCtx.index}
      />
      <AccountBalance balances={balances} index={providerCtx.index} />
      <AccountTransactions
        explorerUrl={explorerUrl}
        hashes={transactionHashes}
      />
      <AccountInternalTransactions
        explorerUrl={explorerUrl}
        hashes={internalTransactionHashes}
      />
    </>
  )
}

const AccountAddress: React.FC<{
  accounts: string[]
  explorerUrl: string
  index: number
}> = ({ accounts, explorerUrl, index }) => {
  if (accounts && accounts[index]) {
    return (
      <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        <button
          onClick={handleClick}
          data-url={`${explorerUrl}address/${accounts[index]}#code`}>
          {`${accounts[index]}`}
        </button>
      </div>
    )
  }
  return <></>
}

const AccountBalance: React.FC<{ balances: bigint[]; index: number }> = ({
  balances,
  index
}) => {
  if (balances[index]) {
    return (
      <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        <span>${ethers.formatEther(balances[index])}</span>
      </div>
    )
  }
  return <></>
}

const AccountTransactions: React.FC<{
  hashes: string[]
  explorerUrl: string
}> = ({ hashes, explorerUrl }) => {
  if (hashes) {
    return (
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        <div>Transactions</div>
        {hashes.map((hash, index) => (
          <button
            key={index}
            onClick={handleClick}
            data-url={`${explorerUrl}tx/${hash}`}>
            {`${hash}`}
          </button>
        ))}
      </div>
    )
  }
  return <></>
}

const AccountInternalTransactions: React.FC<{
  hashes: string[]
  explorerUrl: string
}> = ({ hashes, explorerUrl }) => {
  if (hashes) {
    return (
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        <div>Internal Transactions</div>
        {hashes.map((hash, index) => (
          <button
            key={index}
            onClick={handleClick}
            data-url={`${explorerUrl}tx/${hash}`}>
            {`${hash}`}
          </button>
        ))}
      </div>
    )
  }
  return <></>
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
  address: string
): Promise<string[]> => {
  return transactionsCrawler(
    transactionType.normal,
    `${explorerUrl}address/${address}`
  )
}

const accountInternalTransactions = async (
  explorerUrl: string,
  address: string
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

    const hashes: string[] = []
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
