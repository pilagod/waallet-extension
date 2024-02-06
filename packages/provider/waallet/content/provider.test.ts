import { BackgroundStubMessenger } from "~packages/messenger/background/stub"

import { WaalletMessage } from "../message"
import { WaalletRpcMethod, type EthSendTransactionArguments } from "../rpc"
import { WaalletContentProvider } from "./provider"

describe("Waallet Content Provider", () => {
  const backgroundMessenger = new BackgroundStubMessenger()
  const waalletContentProvider = new WaalletContentProvider(backgroundMessenger)

  beforeEach(() => {
    backgroundMessenger.reset()
  })

  it("should send JsonRpcRequest to background messenger", async () => {
    const txHash = "0xffff"
    backgroundMessenger.mockMsgRes(txHash)

    const args: EthSendTransactionArguments = {
      method: WaalletRpcMethod.eth_sendTransaction,
      params: [
        {
          to: "0x5678",
          value: 123
        }
      ]
    }
    const result = await waalletContentProvider.request(args)

    expect(backgroundMessenger.getSentMsg(0)).toEqual({
      name: WaalletMessage.JsonRpcRequest,
      body: args
    })
    expect(result).toBe(txHash)
  })
})
