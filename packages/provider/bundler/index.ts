import * as ethers from "ethers"

import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export class UserOperationData {
  public sender: HexString
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

  public constructor(data: {
    sender: HexString
    nonce: BigNumberish
    initCode: HexString
    callData: HexString
    callGasLimit?: BigNumberish
    verificationGasLimit?: BigNumberish
    preVerificationGas?: BigNumberish
    maxFeePerGas?: BigNumberish
    maxPriorityFeePerGas?: BigNumberish
    paymasterAndData?: HexString
    signature?: HexString
  }) {
    this.sender = data.sender
    this.nonce = ethers.toBigInt(data.nonce)
    this.initCode = data.initCode
    this.callData = data.callData
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
    if (data.paymasterAndData) {
      this.paymasterAndData = data.paymasterAndData
    }
    if (data.signature) {
      this.signature = data.signature
    }
  }

  public hash(entryPointAddress: HexString, chainId: BigNumberish) {
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
        this.sender,
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
        [ethers.keccak256(userOpPacked), entryPointAddress, chainId]
      )
    )
  }

  public data() {
    return {
      sender: this.sender,
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

  public setGasLimit(data: {
    callGasLimit: BigNumberish
    verificationGasLimit: BigNumberish
    preVerificationGas: BigNumberish
  }) {
    this.callGasLimit = number.toBigInt(data.callGasLimit)
    this.verificationGasLimit = number.toBigInt(data.verificationGasLimit)
    this.preVerificationGas = number.toBigInt(data.preVerificationGas)
  }

  public setGasFee(data: {
    maxFeePerGas: BigNumberish
    maxPriorityFeePerGas: BigNumberish
  }) {
    this.maxFeePerGas = number.toBigInt(data.maxFeePerGas)
    this.maxPriorityFeePerGas = number.toBigInt(data.maxPriorityFeePerGas)
  }

  public setPaymasterAndData(paymasterAndData: HexString) {
    this.paymasterAndData = paymasterAndData
  }

  public setSignature(signature: HexString) {
    this.signature = signature
  }
}

export type UserOperation = {
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

export const UserOperationStruct =
  "(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)"
