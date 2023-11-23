import { WaalletMessageName } from "../messenger"
import { WaalletStubMessenger } from "../messenger/stub"
import { WaalletRpcMethod, type EthSendTransactionArguments } from "../rpc"
import { WaalletContentProvider } from "./provider"

describe("Waallet Content Provider", () => {
  const backgroundMessenger = new WaalletStubMessenger()
  const waalletContentProvider = new WaalletContentProvider(backgroundMessenger)

  beforeEach(() => {
    backgroundMessenger.reset()
  })

  it("should send JsonRpcRequest to background messenger", async () => {
    const txHash = "0xffff"

    backgroundMessenger.mockResBody(txHash)

    const args: EthSendTransactionArguments = {
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          from: "0x1234",
          to: "0x5678",
          value: 123
        }
      ]
    }
    const result = await waalletContentProvider.request(args)

    expect(backgroundMessenger.msgs[0]).toEqual({
      name: WaalletMessageName.JsonRpcRequest,
      body: args
    })
    expect(result).toBe(txHash)
  })
})
