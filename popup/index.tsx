import * as ethers from "ethers"
import { useCallback, useEffect, useState, type MouseEvent } from "react"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/provider/waallet/content/provider"

import "~style.css"

const provider = new ethers.BrowserProvider(
  new WaalletContentProvider(new BackgroundDirectMessenger())
)

function IndexPopup() {
  const [accountIndex, setAccountIndex] = useState<number>(0)
  const [accounts, setAccounts] = useState<string[]>([""])
  const [balances, setBalances] = useState<bigint[]>([0n])
  const [transactionHashes, setTransactionHashes] = useState<string[]>([""])
  const [explorerUrl, setExplorerUrl] = useState<string>("")

  useEffect(() => {
    const _accountIndex = 0
    setAccountIndex(_accountIndex)

    const asyncFn = async () => {
      const _explorerUrl = getExplorerUrl((await provider.getNetwork()).name)
      setExplorerUrl(_explorerUrl)

      const _accounts = (await provider.listAccounts()).map(
        (account) => account.address
      )
      setAccounts(_accounts)

      const _balances = await Promise.all(
        accounts.map(async (account) => {
          return await provider.getBalance(account)
        })
      )
      setBalances(_balances)

      const _transactionHashes = await accountTransactionHashes(
        _explorerUrl,
        _accounts[_accountIndex]
      )
      setTransactionHashes(_transactionHashes)

      console.log(`tx: ${JSON.stringify(_transactionHashes, null, 2)}`)
    }

    asyncFn()
  }, [])

  return (
    <>
      <AccountAddress
        accounts={accounts}
        explorerUrl={explorerUrl}
        index={accountIndex}
      />
      <AccountBalance balances={balances} index={accountIndex} />
      <AccountTransactionHashes
        explorerUrl={explorerUrl}
        transactionHashes={transactionHashes}
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

const AccountTransactionHashes: React.FC<{
  transactionHashes: string[]
  explorerUrl: string
}> = ({ transactionHashes, explorerUrl }) => {
  if (transactionHashes) {
    return (
      <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        {transactionHashes.map((hash, _) => (
          <button onClick={handleClick} data-url={`${explorerUrl}tx/${hash}`}>
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

const accountTransactionHashes = async (
  explorerUrl: string,
  address: string
): Promise<string[]> => {
  try {
    const response = await fetch(`${explorerUrl}address/${address}#internaltx`)
    console.log(`url: ${`${explorerUrl}address/${address}#internaltx`}`)
    const html = await response.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

    const transactionNodes = doc.evaluate(
      "/html/body/main/section[2]/div[4]/div[2]/div/div[2]/table/tbody/tr/td[1]/div/a",
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )

    const hashes = []

    for (let i = 0; i < transactionNodes.snapshotLength; i++) {
      const hash = transactionNodes.snapshotItem(i).textContent.trim()
      hashes.push(hash)
    }

    // Remove the duplicate part.
    return hashes
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

export default IndexPopup
