export type BackgroundMessage<Body> = {
  name: string
  body: Body
}

export interface BackgroundMessenger {
  send<ReqBody, ResBody>(msg: BackgroundMessage<ReqBody>): Promise<ResBody>
}
