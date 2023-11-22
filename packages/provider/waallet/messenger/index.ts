export enum MessageName {
  JsonRpcRequest = "JsonRpcRequest"
}

export type Message<Body> = {
  name: MessageName
  body: Body
}

export interface Messenger {
  send<ReqBody, ResBody>(msg: Message<ReqBody>): Promise<ResBody>
}
