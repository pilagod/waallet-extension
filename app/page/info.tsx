import * as ethers from "ethers"
import { useEffect, useState, type MouseEvent } from "react"
import { Link } from "wouter"

import { useProviderContext } from "~app/context/provider"
import { NavbarLayout } from "~app/layout/navbar"
import { Path } from "~app/path"
import {
  useAccount,
  useNetwork,
  useSentUserOperationStatements,
  useStorage,
  useUserOperationStatements
} from "~app/storage"
import {
  UserOperationStatus,
  type UserOperationStatement
} from "~background/storage"
import { UserOperation } from "~packages/bundler"
import { BundlerMode, BundlerProvider } from "~packages/bundler/provider"
import { NodeProvider } from "~packages/node/provider"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { HexString } from "~typing"

type UserOperationData = {
  status: UserOperationStatus
  hash: HexString
}

export function Info() {
  const explorerUrl = "https://jiffyscan.xyz/"

  const { provider } = useProviderContext()
  const sentUserOpStmts = useSentUserOperationStatements()
  const userOpStmts = useUserOperationStatements()
  const account = useAccount()
  const network = useNetwork()

  const [node, setNode] = useState<NodeProvider>(
    new NodeProvider(network.nodeRpcUrl)
  )
  const [bundler, setBundler] = useState<BundlerProvider>(
    new BundlerProvider(
      network.bundlerRpcUrl,
      network.chainId === 1337 ? BundlerMode.Manual : BundlerMode.Auto // 1337 is local testnet
    )
  )

  const [chainName, setChainName] = useState<string>("")
  const [balance, setBalance] = useState<bigint>(0n)
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false)
  const [userOpsData, setUserOpsData] = useState<UserOperationData[]>([])

  const markUserOperationSucceeded = useStorage(
    (storage) => storage.markUserOperationSucceeded
  )
  const markUserOperationFailed = useStorage(
    (storage) => storage.markUserOperationFailed
  )

  useEffect(() => {
    // Retrieve chainName when the Info page is opened
    const asyncFn = async () => {
      const chain = getChainName((await provider.getNetwork()).name)
      setChainName(chain)
    }

    asyncFn()
  }, [])

  useEffect(() => {
    setBalanceLoading(true)
    // Periodically check the balance of the account
    const asyncIntervalFn = async () => {
      const balance = await provider.getBalance(account.address)
      setBalanceLoading(false)
      setBalance(balance)
    }
    const id = setInterval(() => {
      asyncIntervalFn().catch((e) => console.log(e))
    }, 3333) // Every 3.333 seconds

    return () => {
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    // Update userOpsData when userOpStmts change
    const userOpsData = getUserOpsData(userOpStmts, account.chainId)
    setUserOpsData(userOpsData)
  }, [userOpStmts])

  useEffect(() => {
    // Update node and bundler when network change
    setNode(new NodeProvider(network.nodeRpcUrl))
    setBundler(
      new BundlerProvider(
        network.bundlerRpcUrl,
        network.chainId === 1337 ? BundlerMode.Manual : BundlerMode.Auto // 1337 is local testnet
      )
    )
  }, [network])

  useEffect(() => {
    // Check if the broadcasted userOp has been executed successfully or unsuccessfully when sentUserOpStmts changes
    const asyncFn = async () => {
      sentUserOpStmts.forEach(async (sentUserOpStmt) => {
        const userOp = new UserOperation(sentUserOpStmt.userOp)
        const userOpHash = userOp.hash(
          sentUserOpStmt.entryPointAddress,
          account.chainId
        )
        const transactionHash = await bundler.wait(userOpHash)
        const receipt = await node.getTransactionReceipt(transactionHash)

        let status = -1
        let blockHash = ""
        let blockNumber = ""
        let errorMessage = ""
        if (receipt) {
          //   const call = await node.call(receipt)
          //   console.log(`[tttttt] call: ${call}`)
          status = receipt.status
          blockHash = receipt.blockHash
          blockNumber = number.toHex(receipt.blockNumber)
          errorMessage = (await bundler.getUserOperationReceipt(userOpHash))
            .reason
        }

        switch (status) {
          // '1' indicates a success, '0' indicates a revert, '-1' indicates a null.
          case 0:
            markUserOperationFailed(sentUserOpStmt.id, userOp.data(), {
              userOpHash: userOpHash,
              transactionHash: transactionHash,
              blockHash: blockHash,
              blockNumber: blockNumber,
              errorMessage: errorMessage
            })
            break
          case 1:
            markUserOperationSucceeded(sentUserOpStmt.id, userOp.data(), {
              userOpHash: userOpHash,
              transactionHash: transactionHash,
              blockHash: blockHash,
              blockNumber: blockNumber
            })
            break
          default:
            break
        }
      })
    }

    asyncFn()
  }, [sentUserOpStmts, node, bundler])

  return (
    <NavbarLayout>
      {account.address && (
        <AccountAddress
          account={account.address}
          explorerUrl={explorerUrl}
          chainName={chainName}
        />
      )}
      {<AccountBalance balanceLoading={balanceLoading} balance={balance} />}
      <SwitchToSendPage />
      {
        <UserOpsData
          userOpsData={userOpsData}
          explorerUrl={explorerUrl}
          chainName={chainName}
        />
      }
    </NavbarLayout>
  )
}

const AccountAddress: React.FC<{
  account: HexString
  explorerUrl: string
  chainName: string
}> = ({ account, explorerUrl, chainName }) => {
  return (
    <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <button
        onClick={handleClick}
        data-url={`${explorerUrl}account/${account}?network=${chainName}`}>
        {`${account}`}
      </button>
    </div>
  )
}

const AccountBalance: React.FC<{
  balanceLoading: boolean
  balance: bigint
}> = ({ balanceLoading, balance }) => {
  return (
    <div className="flex justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      Balance: {balanceLoading ? "(Loading...)" : ethers.formatEther(balance)}
    </div>
  )
}

const SwitchToSendPage: React.FC = () => {
  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      <Link href={Path.Send}>Send ↗</Link>
    </div>
  )
}

const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
  const url = event.currentTarget.getAttribute("data-url")

  if (url) {
    chrome.tabs.create({ url })
  }
}

const getUserOpsData = (
  userOpStmts: UserOperationStatement[],
  chainId: number
): UserOperationData[] => {
  return userOpStmts.map((userOpStmt) => {
    const userOp = new UserOperation(userOpStmt.userOp)
    return {
      status: userOpStmt.status,
      hash: userOp.hash(userOpStmt.entryPointAddress, chainId)
    }
  })
}

const UserOpsData: React.FC<{
  userOpsData: UserOperationData[]
  explorerUrl: string
  chainName: string
}> = ({ userOpsData, explorerUrl, chainName }) => {
  return (
    <div className="flex-col justify-center items-center h-auto p-3 border-0 rounded-lg text-base">
      User Operation History:
      {userOpsData.length === 0 ? (
        <div>(No user operations)</div>
      ) : (
        userOpsData.map((userOp, i, _) => (
          <div>
            <span>{`${userOp.status}: `}</span>
            <button
              key={i} // Prevent the "Each child in a list should have a unique 'key' prop" warning.
              onClick={handleClick}
              data-url={`${explorerUrl}userOpHash/${userOp.hash}?network=${chainName}`}>
              {`${address.ellipsize(userOp.hash)}`}
            </button>
          </div>
        ))
      )}
    </div>
  )
}

const getChainName = (chain: string | number): string => {
  const net = typeof chain === "string" ? chain.toLowerCase() : chain
  let chainName: string
  switch (net) {
    case "mainnet":
    case 1:
      chainName = "mainnet"
      break
    case "goerli":
    case 5:
      chainName = "goerli"
      break
    case "optimism":
    case 10:
      chainName = "optimism"
      break
    case "bsc":
    case 56:
      chainName = "bsc"
      break
    case "matic":
    case 137:
      chainName = "matic"
      break
    case "arbitrum-one":
    case 42161:
      chainName = "arbitrum-one"
      break
    case "sepolia":
    case 11155111:
      chainName = "sepolia"
      break
    default:
      chainName = null
  }
  return chainName
}
