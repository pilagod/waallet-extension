export enum WaalletMessageName {
  JsonRpcRequest = "JsonRpcRequest"
}

export type WaalletMessage<Body> = {
  name: WaalletMessageName
  body: Body
}

export interface WaalletMessenger {
  send<ReqBody, ResBody>(msg: WaalletMessage<ReqBody>): Promise<ResBody>
}
