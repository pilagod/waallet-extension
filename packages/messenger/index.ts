export type Message<Body> = {
  name: string
  body: Body
}

export interface Messenger {
  send<Request, Response>(msg: Message<Request>): Promise<Response>
}
