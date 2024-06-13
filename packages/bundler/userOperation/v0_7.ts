import * as ethers from "ethers"

import number from "~packages/util/number"
import type { BigNumberish, HexString, RequiredPick } from "~typing"

export type UserOperationDataV0_7 = {
  sender: HexString
  nonce: BigNumberish
  callData: HexString
  factory: HexString
  factoryData: HexString
  callGasLimit: BigNumberish
  verificationGasLimit: BigNumberish
  preVerificationGas: BigNumberish
  maxFeePerGas: BigNumberish
  maxPriorityFeePerGas: BigNumberish
  paymasterVerificationGasLimit: BigNumberish
  paymasterPostOpGasLimit: BigNumberish
  paymaster: HexString
  paymasterData: HexString
  signature: HexString
}

export class UserOperationV0_7 {
  public static getSolidityStructType() {
    return "(address sender, uint256 nonce, bytes initCode, bytes callData, bytes32 accountGasLimits, uint256 preVerificationGas, bytes32 gasFees, bytes paymasterAndData, bytes signature)"
  }

  public sender: HexString
  public nonce: bigint
  public callData: HexString
  public factory: HexString = "0x"
  public factoryData: HexString = "0x"
  public callGasLimit: bigint = 0n
  public verificationGasLimit: bigint = 0n
  public preVerificationGas: bigint = 0n
  public maxFeePerGas: bigint = 0n
  public maxPriorityFeePerGas: bigint = 0n
  public paymasterVerificationGasLimit: bigint = 0n
  public paymasterPostOpGasLimit: bigint = 0n
  public paymaster: HexString = "0x"
  public paymasterData: HexString = "0x"
  public signature: HexString = "0x"

  public constructor(
    data: RequiredPick<
      Partial<UserOperationDataV0_7>,
      "sender" | "nonce" | "callData"
    >
  ) {
    this.sender = data.sender
    this.nonce = number.toBigInt(data.nonce)
    this.callData = data.callData
    if (this.factory) {
      this.factory = data.factory
    }
    if (this.factoryData) {
      this.factoryData = data.factoryData
    }
    if (data.callGasLimit) {
      this.callGasLimit = number.toBigInt(data.callGasLimit)
    }
    if (data.verificationGasLimit) {
      this.verificationGasLimit = number.toBigInt(data.verificationGasLimit)
    }
    if (data.preVerificationGas) {
      this.preVerificationGas = number.toBigInt(data.preVerificationGas)
    }
    if (data.maxFeePerGas) {
      this.maxFeePerGas = number.toBigInt(data.maxFeePerGas)
    }
    if (data.maxPriorityFeePerGas) {
      this.maxPriorityFeePerGas = number.toBigInt(data.maxPriorityFeePerGas)
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
    if (data.paymaster) {
      this.paymaster = data.paymaster
    }
    if (data.paymasterData) {
      this.paymasterData = data.paymasterData
    }
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

  public data(): UserOperationDataV0_7 {
    return {
      sender: this.sender,
      nonce: number.toHex(this.nonce),
      factory: this.factory,
      factoryData: this.factoryData,
      callData: this.callData,
      callGasLimit: number.toHex(this.callGasLimit),
      verificationGasLimit: number.toHex(this.verificationGasLimit),
      preVerificationGas: number.toHex(this.preVerificationGas),
      maxFeePerGas: number.toHex(this.maxFeePerGas),
      maxPriorityFeePerGas: number.toHex(this.maxPriorityFeePerGas),
      paymasterVerificationGasLimit: number.toHex(
        this.paymasterVerificationGasLimit
      ),
      paymasterPostOpGasLimit: number.toHex(this.paymasterPostOpGasLimit),
      paymaster: this.paymaster,
      paymasterData: this.paymasterData,
      signature: this.signature
    }
  }

  public getInitCode() {
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
    return ethers.concat([
      this.paymaster,
      ethers.zeroPadValue(number.toHex(this.paymasterVerificationGasLimit), 16),
      ethers.zeroPadValue(number.toHex(this.paymasterPostOpGasLimit), 16),
      this.paymasterData
    ])
  }

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
