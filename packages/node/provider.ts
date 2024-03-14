import * as ethers from "ethers"

export class NodeProvider extends ethers.JsonRpcProvider {
  public readonly url: string

  public constructor(
    url: string,
    network?: ethers.Networkish,
    options?: ethers.JsonRpcApiProviderOptions
  ) {
    super(url, network, options)
    this.url = url
  }
}
