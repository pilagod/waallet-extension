import * as ethers from "ethers"
import { useCallback, useEffect, useState, type MouseEvent } from "react"

import { BackgroundDirectMessenger } from "~packages/messenger/background/direct"
import { WaalletContentProvider } from "~packages/provider/waallet/content/provider"

import "~style.css"

const provider = new ethers.BrowserProvider(
  new WaalletContentProvider(new BackgroundDirectMessenger())
)

const AccountAddress: React.FC<{
  accounts: string[]
  networkName: string
  index: number
}> = ({ accounts, networkName, index }) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const url = event.currentTarget.getAttribute("data-url")

      if (url) {
        chrome.tabs.create({ url })
      }
    },
    [accounts]
  )

  if (accounts && accounts[index]) {
    return (
      <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
        <button
          onClick={handleClick}
          data-url={`https://${networkName}.etherscan.io/address/${accounts[index]}#code`}>
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

function IndexPopup() {
  const [accounts, setAccounts] = useState<string[]>([""])
  const [balances, setBalances] = useState<bigint[]>([0n])
  const [networkName, setNetworkName] = useState<string>("")

  useEffect(() => {
    const asyncFn = async () => {
      const accounts = (await provider.listAccounts()).map(
        (account) => account.address
      )
      const balances = await Promise.all(
        accounts.map(async (account) => {
          return await provider.getBalance(account)
        })
      )
      setAccounts(accounts)
      setBalances(balances)
      setNetworkName((await provider.getNetwork()).name)
      console.log(`${JSON.stringify(provider, null, 2)}`)
    }
    asyncFn()
  }, [])

  return (
    <>
      <AccountAddress accounts={accounts} networkName={networkName} index={0} />
      <AccountBalance balances={balances} index={0} />
    </>
  )
}
export default IndexPopup
