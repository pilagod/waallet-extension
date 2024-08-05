import { Wallet } from "ethers"
import { useContext } from "react"
import Circle from "react:~assets/circle.svg"
import CircleDot from "react:~assets/circleDot.svg"
import { useHashLocation } from "wouter/use-hash-location"

import { StepBackHeader } from "~app/component/stepBackHeader"
import { ProviderContext } from "~app/context/provider"
import { ToastContext } from "~app/context/toastContext"
import {
  useAction,
  useNetwork,
  useNetworks,
  useTotalAccountCount
} from "~app/hook/storage"
import { Path } from "~app/path"
import { AccountType } from "~packages/account"
import { SimpleAccount } from "~packages/account/SimpleAccount"
import number from "~packages/util/number"

export function NetworkList() {
  const [, navigate] = useHashLocation()
  const { provider } = useContext(ProviderContext)
  const { setToast } = useContext(ToastContext)

  const { switchNetwork, createSimpleAccount } = useAction()

  const network = useNetwork()
  const networks = useNetworks()
  const totalAccountCount = useTotalAccountCount()

  const selectNetwork = async (networkId: string) => {
    // Switch networks to update the `provider` to the target network,
    // it also checks if the target network exists
    await switchNetwork(networkId)

    const targetNetwork = networks.find((network) => network.id === networkId)

    const targetHasNoAccount = !targetNetwork?.accountActive

    const targetHasSimpleAccountFactory =
      targetNetwork.accountFactory[AccountType.SimpleAccount] &&
      targetNetwork.accountFactory[AccountType.SimpleAccount] !== "0x"

    // Initialize an account if it doesn’t exist on the target network.
    if (targetHasNoAccount && targetHasSimpleAccountFactory) {
      const account = await SimpleAccount.initWithFactory(provider, {
        ownerPrivateKey: Wallet.createRandom().privateKey,
        salt: number.random(),
        factoryAddress: targetNetwork.accountFactory[AccountType.SimpleAccount]
      })

      await createSimpleAccount(
        `Account ${totalAccountCount + 1}`,
        account,
        networkId
      )
      setToast("Account created!", "success")
    }
    navigate(Path.Home)
  }

  return (
    <>
      <StepBackHeader title="Select Network" />

      {/* Network List */}
      <section className="w-[calc(100%+32px)] ml-[-16px] pt-[16px]">
        {networks.map((n, i) => {
          return (
            <div
              key={i}
              className="cursor-pointer hover:bg-[#F5F5F5]"
              onClick={() => selectNetwork(n.id)}>
              <NetworkItem
                name={n.name}
                icon={n.icon}
                active={n.id === network.id}
              />
            </div>
          )
        })}
      </section>
    </>
  )
}

function NetworkItem(props: { name: string; icon: string; active: boolean }) {
  return (
    <div className="flex flex-row items-center gap-[12px] p-[16px]">
      <div className="basis-[36px]">
        <img src={props.icon} alt={props.name} />
      </div>
      <div className="min-w-0 grow">
        <span className="text-[20px]">{props.name}</span>
      </div>
      <div className="basis-[20px]">
        {props.active ? <CircleDot /> : <Circle />}
      </div>
    </div>
  )
}
