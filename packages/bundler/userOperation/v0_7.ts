import * as ethers from "ethers"

import { Execution } from "~packages/account"
import address from "~packages/util/address"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export type UserOperationDataV0_7 = {
  sender: HexString
  nonce: BigNumberish
  callData: HexString
  factory?: HexString
  factoryData?: HexString
  callGasLimit: BigNumberish
  verificationGasLimit: BigNumberish
  preVerificationGas: BigNumberish
  maxFeePerGas: BigNumberish
  maxPriorityFeePerGas: BigNumberish
  paymasterVerificationGasLimit: BigNumberish
  paymasterPostOpGasLimit: BigNumberish
  paymaster?: HexString
  paymasterData?: HexString
  signature: HexString
}

export class UserOperationV0_7 {
  public static getSolidityStructType() {
    return "(address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature)"
  }

  public static wrap(intent: Execution | Partial<UserOperationDataV0_7>) {
    return new UserOperationV0_7({ ...intent })
  }

  public sender: HexString
  public nonce: bigint
  public callData: HexString
  public factory?: HexString
  public factoryData: HexString = "0x"
  public callGasLimit: bigint = 0n
  public verificationGasLimit: bigint = 0n
  public preVerificationGas: bigint = 0n
  public maxFeePerGas: bigint = 0n
  public maxPriorityFeePerGas: bigint = 0n
  public paymasterVerificationGasLimit: bigint = 0n
  public paymasterPostOpGasLimit: bigint = 0n
  public paymaster?: HexString
  public paymasterData: HexString = "0x"
  public signature: HexString = "0x"

  public constructor(data: Partial<UserOperationDataV0_7>) {
    this.sender = data.sender
    this.nonce = number.toBigInt(data.nonce)
    this.callData = data.callData

    this.setFactory(data)
    this.setGasFee(data)
    this.setGasLimit(data)
    this.setPaymaster(data)

    if (data.signature) {
      this.signature = data.signature
    }
  }

  public hash(entryPoint: HexString, chainId: BigNumberish) {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder()
    const userOpPacked = abiCoder.encode(
      [
        "address", // sender
        "uint256", // nonce
        "bytes32", // initCode
        "bytes32", // callData
        "bytes32", // accountGasLimits
        "uint256", // preVerificationGas
        "bytes32", // gasFees
        "bytes32" // paymasterAndData
      ],
      [
        this.sender,
        this.nonce,
        ethers.keccak256(this.getInitCode()),
        ethers.keccak256(this.callData),
        this.getAccountGasLimits(),
        this.preVerificationGas,
        this.getGasFees(),
        ethers.keccak256(this.getPaymasterAndData())
      ]
    )
    return ethers.keccak256(
      abiCoder.encode(
        ["bytes32", "address", "uint256"],
        [ethers.keccak256(userOpPacked), entryPoint, chainId]
      )
    )
  }

  /**
   * @dev This data format is for bundler.
   */
  public unwrap(): UserOperationDataV0_7 {
    return {
      sender: this.sender,
      nonce: number.toHex(this.nonce),
      callData: this.callData,
      ...(this.factory && {
        factory: this.factory,
        factoryData: this.factoryData
      }),
      callGasLimit: number.toHex(this.callGasLimit),
      verificationGasLimit: number.toHex(this.verificationGasLimit),
      preVerificationGas: number.toHex(this.preVerificationGas),
      maxFeePerGas: number.toHex(this.maxFeePerGas),
      maxPriorityFeePerGas: number.toHex(this.maxPriorityFeePerGas),
      paymasterVerificationGasLimit: number.toHex(
        this.paymasterVerificationGasLimit
      ),
      paymasterPostOpGasLimit: number.toHex(this.paymasterPostOpGasLimit),
      ...(this.paymaster && {
        paymaster: this.paymaster,
        paymasterData: this.paymasterData
      }),
      signature: this.signature
    }
  }

  /**
   * @dev This data format is for Solidity contract.
   */
  public unwrapPacked() {
    return {
      sender: this.sender,
      nonce: number.toHex(this.nonce),
      initCode: this.getInitCode(),
      callData: this.callData,
      accountGasLimits: this.getAccountGasLimits(),
      preVerificationGas: number.toHex(this.preVerificationGas),
      gasFees: this.getGasFees(),
      paymasterAndData: this.getPaymasterAndData(),
      signature: this.signature
    }
  }

  /* getter */

  public getInitCode() {
    if (!this.factory) {
      return "0x"
    }
    return ethers.concat([this.factory, this.factoryData])
  }

  public getAccountGasLimits() {
    return ethers.concat([
      ethers.zeroPadValue(number.toHex(this.verificationGasLimit), 16),
      ethers.zeroPadValue(number.toHex(this.callGasLimit), 16)
    ])
  }

  public getGasFees() {
    return ethers.concat([
      ethers.zeroPadValue(number.toHex(this.maxPriorityFeePerGas), 16),
      ethers.zeroPadValue(number.toHex(this.maxFeePerGas), 16)
    ])
  }

  public getPaymasterAndData() {
    if (!this.paymaster) {
      return "0x"
    }
    return ethers.concat([
      this.paymaster,
      ethers.zeroPadValue(number.toHex(this.paymasterVerificationGasLimit), 16),
      ethers.zeroPadValue(number.toHex(this.paymasterPostOpGasLimit), 16),
      this.paymasterData
    ])
  }

  /* setter */

  public setNonce(nonce: BigNumberish) {
    this.nonce = number.toBigInt(nonce)
  }

  public setFactory(data: { factory?: HexString; factoryData?: HexString }) {
    if (data.factory) {
      this.factory = ethers.getAddress(data.factory)
    }
    if (data.factoryData) {
      this.factoryData = data.factoryData
    }
  }

  public setGasFee(gasPrice: BigNumberish): void
  public setGasFee(gasFee: {
    maxFeePerGas?: BigNumberish
    maxPriorityFeePerGas?: BigNumberish
  }): void
  public setGasFee(
    gasPriceOrFee:
      | BigNumberish
      | {
          maxFeePerGas?: BigNumberish
          maxPriorityFeePerGas?: BigNumberish
        }
  ) {
    if (typeof gasPriceOrFee !== "object") {
      const gasPrice = number.toBigInt(gasPriceOrFee)
      this.maxFeePerGas = gasPrice
      this.maxPriorityFeePerGas = gasPrice
      return
    }
    const { maxFeePerGas, maxPriorityFeePerGas } = gasPriceOrFee
    if (maxFeePerGas) {
      this.maxFeePerGas = number.toBigInt(maxFeePerGas)
    }
    if (maxPriorityFeePerGas) {
      this.maxPriorityFeePerGas = number.toBigInt(maxPriorityFeePerGas)
    }
  }

  public setGasLimit(data: {
    callGasLimit?: BigNumberish
    verificationGasLimit?: BigNumberish
    preVerificationGas?: BigNumberish
    paymasterVerificationGasLimit?: BigNumberish
    paymasterPostOpGasLimit?: BigNumberish
  }) {
    if (data.callGasLimit) {
      this.callGasLimit = number.toBigInt(data.callGasLimit)
    }
    if (data.verificationGasLimit) {
      this.verificationGasLimit = number.toBigInt(data.verificationGasLimit)
    }
    if (data.preVerificationGas) {
      this.preVerificationGas = number.toBigInt(data.preVerificationGas)
    }
    if (data.paymasterVerificationGasLimit) {
      this.paymasterVerificationGasLimit = number.toBigInt(
        data.paymasterVerificationGasLimit
      )
    }
    if (data.paymasterPostOpGasLimit) {
      this.paymasterPostOpGasLimit = number.toBigInt(
        data.paymasterVerificationGasLimit
      )
    }
  }

  public setPaymaster(data: {
    paymaster?: HexString
    paymasterData?: HexString
  }) {
    if (data.paymaster) {
      this.paymaster = address.normalize(data.paymaster)
    }
    if (data.paymasterData) {
      this.paymasterData = data.paymasterData
    }
  }

  public setPaymasterAndData(paymasterAndData: HexString) {
    if (ethers.dataLength(paymasterAndData) < 20) {
      return
    }
    this.paymaster = ethers.dataSlice(paymasterAndData, 0, 20)
    this.paymasterData = ethers.dataSlice(paymasterAndData, 20)
  }

  public setSignature(signature: HexString) {
    this.signature = signature
  }

  /* util */

  public calculateGasFee() {
    return (
      (this.verificationGasLimit +
        this.callGasLimit +
        this.paymasterVerificationGasLimit +
        this.paymasterPostOpGasLimit +
        this.preVerificationGas) *
      this.maxFeePerGas
    )
  }
}
