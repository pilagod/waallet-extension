import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { ScrollableWrapper } from "~app/component/scrollableWrapper"
import { StepBackHeader } from "~app/component/stepBackHeader"
import { useAction, type Network } from "~app/hook/storage"
import type { Account } from "~packages/account"
import { eip712Hash } from "~packages/eip/712"
import { format } from "~packages/util/json"
import type { Eip712Request } from "~storage/local/state"

export function Eip712Confirmation(props: {
  request: Eip712Request
  account: {
    actor: Account
  }
  network: Network
}) {
  const { request, account } = props

  const { rejectEip712Request, resolveEip712Request } = useAction()

  const cancel = async () => {
    await rejectEip712Request(request.id)
  }
  const sign = async () => {
    const signature = await account.actor.sign(eip712Hash(request))
    await resolveEip712Request(request.id, signature)
  }

  return (
    <>
      <StepBackHeader title="Signing Request" />

      <ScrollableWrapper x={true} className="p-[16px] h-[381px]">
        <section>
          <h2 className="text-[12px] text-[#989898]">Domain</h2>
          <div className="mt-[8px] text-[16px]">
            <pre>{format(request.domain)}</pre>
          </div>
        </section>
        <section className="mt-[16px]">
          <h2 className="text-[12px] text-[#989898]">
            Message - {request.primaryType}
          </h2>
          <div className="mt-[8px] text-[16px]">
            <pre>{format(request.message)}</pre>
          </div>
        </section>
      </ScrollableWrapper>

      <Divider />

      <div className="py-[22px] flex justify-between gap-[16px] text-[18px] font-semibold">
        <Button onClick={cancel} text="Cancel" variant="white" />
        <Button onClick={sign} text="Sign" variant="black" />
      </div>
    </>
  )
}
