import Circle from "react:~assets/circle.svg"
import CircleDot from "react:~assets/circleDot.svg"
import { useHashLocation } from "wouter/use-hash-location"

import { StepBackHeader } from "~app/component/stepBackHeader"
import { useAction, useNetwork, useNetworks } from "~app/hook/storage"
import { Path } from "~app/path"

export function NetworkList() {
  const [, navigate] = useHashLocation()
  const { switchNetwork } = useAction()

  const network = useNetwork()
  const networks = useNetworks()
  const selectNetwork = async (networkId: string) => {
    await switchNetwork(networkId)
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
