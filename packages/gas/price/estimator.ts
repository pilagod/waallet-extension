import { BundlerProvider } from "~packages/bundler/provider"
import { NodeProvider } from "~packages/node/provider"

export class GasPriceEstimator {
  public constructor(
    private node: NodeProvider,
    private bundler: BundlerProvider
  ) {}

  public async estimate() {
    const addBuffer = (n: bigint) => (n * 120n) / 100n
    const fee = await this.getFee()
    return {
      maxFeePerGas: addBuffer(fee.maxFeePerGas),
      maxPriorityFeePerGas: addBuffer(fee.maxPriorityFeePerGas)
    }
  }

  private async getFee(): Promise<{
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }> {
    const fee = await this.node.getFeeData()
    if (!fee.maxFeePerGas) {
      return {
        maxFeePerGas: fee.gasPrice,
        maxPriorityFeePerGas: fee.gasPrice
      }
    }
    const maxPriorityFeePerGas = await this.bundler.getMaxPriorityFeePerGas()
    if (maxPriorityFeePerGas > fee.maxPriorityFeePerGas) {
      return {
        maxFeePerGas:
          fee.maxFeePerGas + (maxPriorityFeePerGas - fee.maxPriorityFeePerGas),
        maxPriorityFeePerGas
      }
    }
    return {
      maxFeePerGas: fee.maxFeePerGas,
      maxPriorityFeePerGas: fee.maxPriorityFeePerGas
    }
  }
}
