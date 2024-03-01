import * as ethers from "ethers"

import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export type AccessListEntry = { address: string; storageKeys: Array<string> }

// Refer: https://docs.metamask.io/wallet/reference/eth_estimategas/
export class EthEstimateGas {
  public type?: null | number
  public nonce?: null | number
  public to?: null | HexString
  public from?: null | HexString
  public gas?: null | BigNumberish
  public value?: null | BigNumberish
  public input?: null | HexString
  public gasPrice?: null | BigNumberish
  public maxPriorityFeePerGas?: null | BigNumberish
  public maxFeePerGas?: null | BigNumberish
  public maxFeePerBlobGas?: null | BigNumberish
  public accessList?: null | Array<AccessListEntry>
  public blobVersionedHashes?: null | Array<string>
  public chainId?: null | BigNumberish
  public data?: null | HexString

  public constructor(params: {
    type?: null | number
    nonce?: null | number
    to?: null | HexString
    from?: null | HexString
    gas?: null | BigNumberish
    value?: null | BigNumberish
    input?: null | HexString
    gasPrice?: null | BigNumberish
    maxPriorityFeePerGas?: null | BigNumberish
    maxFeePerGas?: null | BigNumberish
    maxFeePerBlobGas?: null | BigNumberish
    accessList?: null | Array<AccessListEntry>
    blobVersionedHashes?: null | Array<string>
    chainId?: null | BigNumberish
    data?: null | HexString
  }) {
    this.type = params.type
    this.nonce = params.nonce
    this.blobVersionedHashes = params.blobVersionedHashes

    if (params.to) {
      this.to = ethers.getAddress(params.to)
    }
    if (params.from) {
      this.from = ethers.getAddress(params.from)
    }
    if (params.gas) {
      this.gas = number.toBigInt(params.gas)
    }
    if (params.value) {
      this.value = number.toBigInt(params.value)
    }
    if (params.maxFeePerBlobGas) {
      this.maxFeePerBlobGas = number.toBigInt(params.maxFeePerBlobGas)
    }
    if (params.chainId) {
      this.chainId = number.toBigInt(params.chainId)
    }

    // Refer: https://github.com/web3/web3.js/issues/6183
    if (params.input) {
      this.input = params.input
      this.data = params.input
    } else if (params.data) {
      this.input = params.data
      this.data = params.data
    }

    if (params.maxPriorityFeePerGas && params.maxFeePerGas) {
      this.gasPrice = null
      this.maxPriorityFeePerGas = number.toBigInt(params.maxPriorityFeePerGas)
      this.maxFeePerGas = number.toBigInt(params.maxFeePerGas)
    } else if (params.gasPrice) {
      this.gasPrice = number.toBigInt(params.gasPrice)
      this.maxPriorityFeePerGas = null
      this.maxFeePerGas = null
    }

    if (params.accessList) {
      params.accessList.forEach((entry) => {
        entry.address = ethers.getAddress(entry.address)
      })
    }
  }

  public params() {
    return {
      type: this.type,
      nonce: this.nonce,
      to: this.to ? ethers.getAddress(this.to) : null,
      from: this.from ? ethers.getAddress(this.from) : null,
      gas: this.gas ? number.toHex(this.gas) : null,
      value: this.value ? number.toHex(this.value) : null,
      input: this.input,
      gasPrice: this.gasPrice ? number.toHex(this.gasPrice) : null,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas
        ? number.toHex(this.maxPriorityFeePerGas)
        : null,
      maxFeePerGas: this.maxFeePerGas ? number.toHex(this.maxFeePerGas) : null,
      maxFeePerBlobGas: this.maxFeePerBlobGas
        ? number.toHex(this.maxFeePerBlobGas)
        : null,
      accessList: this.accessList,
      blobVersionedHashes: this.blobVersionedHashes,
      chainId: this.chainId ? number.toHex(this.chainId) : null
    }
  }
}

// Refer: https://docs.metamask.io/wallet/reference/eth_sendtransaction/
export class EthSendTransaction {
  public to?: null | HexString
  public from: HexString = ethers.ZeroAddress
  public gas?: null | BigNumberish
  public value?: null | BigNumberish
  public data: HexString = "0x"
  public gasPrice?: null | BigNumberish
  public maxPriorityFeePerGas?: null | BigNumberish
  public maxFeePerGas?: null | BigNumberish
  public nonce?: null | number
  public input?: null | HexString

  public constructor(params: {
    to?: null | HexString
    from: HexString
    gas?: null | BigNumberish
    value?: null | BigNumberish
    data?: null | HexString
    gasPrice?: null | BigNumberish
    maxPriorityFeePerGas?: null | BigNumberish
    maxFeePerGas?: null | BigNumberish
    nonce?: null | number
    input?: null | HexString
  }) {
    this.from = ethers.getAddress(params.from)
    this.data = params.data
    this.nonce = params.nonce

    if (params.to) {
      this.to = ethers.getAddress(params.to)
    }
    if (params.gas) {
      this.gas = number.toBigInt(params.gas)
    }
    if (params.value) {
      this.value = number.toBigInt(params.value)
    }

    // Refer: https://github.com/web3/web3.js/issues/6183
    if (params.input) {
      this.input = params.input
      this.data = params.input
    } else if (params.data) {
      this.input = params.data
      this.data = params.data
    }

    if (params.maxPriorityFeePerGas && params.maxFeePerGas) {
      this.gasPrice = null
      this.maxPriorityFeePerGas = number.toBigInt(params.maxPriorityFeePerGas)
      this.maxFeePerGas = number.toBigInt(params.maxFeePerGas)
    } else if (params.gasPrice) {
      this.gasPrice = number.toBigInt(params.gasPrice)
      this.maxPriorityFeePerGas = null
      this.maxFeePerGas = null
    }
  }

  public params() {
    return {
      to: this.to,
      from: this.from,
      gas: this.gas ? number.toHex(this.gas) : null,
      value: this.value ? number.toHex(this.value) : null,
      data: this.data,
      gasPrice: this.gasPrice ? number.toHex(this.gasPrice) : null,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas
        ? number.toHex(this.maxPriorityFeePerGas)
        : null,
      maxFeePerGas: this.maxFeePerGas ? number.toHex(this.maxFeePerGas) : null,
      nonce: this.nonce,
      input: this.input
    }
  }
}
