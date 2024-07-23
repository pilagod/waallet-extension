import Circle from "react:~assets/circle.svg"
import CircleDot from "react:~assets/circleDot.svg"

import { StepBackHeader } from "~app/component/stepBackHeader"
import { useNetwork, useNetworks } from "~app/hook/storage"

export function NetworkList() {
  const network = useNetwork()
  const networks = useNetworks()
  return (
    <>
      <StepBackHeader title="Select Network" />

      {/* Network List */}
      <section className="pt-[16px]">
        {networks.map((n, i) => {
          return (
            <div key={i}>
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
    <div className="flex flex-row items-center gap-[12px] py-[16px]">
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
