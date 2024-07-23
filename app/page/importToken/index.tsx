import { Button } from "~app/component/button"
import { Divider } from "~app/component/divider"
import { StepBackHeader } from "~app/component/stepBackHeader"

export function ImportToken() {
  return (
    <>
      <StepBackHeader title="Import Token" />

      {/* Contract Address Input */}
      <section className="h-[373px] pt-[24px]">
        <div className="text-[16px]">Contract Address</div>
        <div className="mt-[8px]">
          <input
            type="text"
            id="contract-address"
            className="w-full border-solid border-black border-[2px] rounded-[16px] p-[16px] text-[16px]"
            placeholder="Enter contract address"
            required
          />
        </div>
      </section>

      <Divider />

      {/* Import Token Button */}
      <section className="py-[22.5px]">
        <div className="text-[18px]">
          <Button text="Import token" variant="black" />
        </div>
      </section>
    </>
  )
}
