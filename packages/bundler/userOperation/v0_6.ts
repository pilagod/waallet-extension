import * as ethers from "ethers"

import { Execution } from "~packages/account"
import { Address } from "~packages/primitive"
import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export type UserOperationDataV0_6 = {
  sender: HexString
  nonce: BigNumberish
  initCode: HexString
  callData: HexString
  callGasLimit: BigNumberish
  verificationGasLimit: BigNumberish
  preVerificationGas: BigNumberish
  maxFeePerGas: BigNumberish
  maxPriorityFeePerGas: BigNumberish
  paymasterAndData: HexString
  signature: HexString
}

export class UserOperationV0_6 {
  public static getSolidityStructType() {
    return "(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)"
  }

  public static wrap(intent: Execution | Partial<UserOperationDataV0_6>) {
    if (intent instanceof Execution) {
      const { factory, factoryData, ...data } = intent
      return new UserOperationV0_6({
        ...data,
        initCode: ethers.concat([factory ?? "0x", factoryData ?? "0x"])
      })
    }
    return new UserOperationV0_6({ ...intent })
  }

  public sender: Address
  public nonce: bigint
  public initCode: HexString
  public callData: HexString
  public callGasLimit: bigint = 0n
  public verificationGasLimit: bigint = 0n
  public preVerificationGas: bigint = 0n
  public maxFeePerGas: bigint = 0n
  public maxPriorityFeePerGas: bigint = 0n
  public paymasterAndData: HexString = "0x"
  public signature: HexString = "0x"

  public constructor(data: Partial<UserOperationDataV0_6>) {
    this.sender = Address.wrap(data.sender)
    this.nonce = number.toBigInt(data.nonce)
    this.callData = data.callData

    if (data.initCode) {
      this.initCode = data.initCode
    }

    this.setGasFee(data)
    this.setGasLimit(data)

    if (data.paymasterAndData) {
      this.paymasterAndData = data.paymasterAndData
    }
    if (data.signature) {
      this.signature = data.signature
    }
  }

  public hash(entryPoint: HexString, chainId: BigNumberish) {
    const abiCoder = ethers.AbiCoder.defaultAbiCoder()
    const userOpPacked = abiCoder.encode(
      [
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes32"
      ],
      [
        this.sender.unwrap(),
        this.nonce,
        ethers.keccak256(this.initCode),
        ethers.keccak256(this.callData),
        this.callGasLimit,
        this.verificationGasLimit,
        this.preVerificationGas,
        this.maxFeePerGas,
        this.maxPriorityFeePerGas,
        ethers.keccak256(this.paymasterAndData)
      ]
    )
    return ethers.keccak256(
      abiCoder.encode(
        ["bytes32", "address", "uint256"],
        [ethers.keccak256(userOpPacked), entryPoint, chainId]
      )
    )
  }

  public unwrap(): UserOperationDataV0_6 {
    return {
      sender: this.sender.unwrap(),
      nonce: number.toHex(this.nonce),
      initCode: this.initCode,
      callData: this.callData,
      callGasLimit: number.toHex(this.callGasLimit),
      verificationGasLimit: number.toHex(this.verificationGasLimit),
      preVerificationGas: number.toHex(this.preVerificationGas),
      maxFeePerGas: number.toHex(this.maxFeePerGas),
      maxPriorityFeePerGas: number.toHex(this.maxPriorityFeePerGas),
      paymasterAndData: this.paymasterAndData,
      signature: this.signature
    }
  }

  /* setter */

  public setNonce(nonce: BigNumberish) {
    this.nonce = number.toBigInt(nonce)
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
  }

  public unsetGasLimit() {
    this.callGasLimit = 0n
    this.verificationGasLimit = 0n
    this.preVerificationGas = 0n
  }

  public setPaymasterAndData(paymasterAndData: HexString) {
    this.paymasterAndData = paymasterAndData
  }

  public setSignature(signature: HexString) {
    this.signature = signature
  }

  /* util */

  public calculateGasFee() {
    return (
      (this.callGasLimit +
        this.verificationGasLimit * (this.paymasterAndData === "0x" ? 1n : 3n) +
        this.preVerificationGas) *
      this.maxFeePerGas
    )
  }

  public isGasEstimated() {
    return !!(
      this.callGasLimit &&
      this.verificationGasLimit &&
      this.preVerificationGas
    )
  }

  public isGasFeeEstimated() {
    return !!(this.maxFeePerGas && this.maxPriorityFeePerGas)
  }

  public isSender(address: HexString) {
    return this.sender.isEqual(address)
  }
}
