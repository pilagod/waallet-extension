import * as ethers from "ethers"

import number from "~packages/util/number"
import type { BigNumberish, HexString } from "~typing"

export type AccessListEntry = {
  address: HexString
  storageKeys: Array<HexString>
}

export type Transaction = {
  type?: null | BigNumberish
  nonce?: null | BigNumberish
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
  blobVersionedHashes?: null | Array<HexString>
  blobs?: null | Array<HexString>
  chainId?: null | BigNumberish
  data?: null | HexString
}

// Refer:
// - https://ethereum.github.io/execution-apis/api-documentation/
// - https://ethereum.org/en/developers/docs/apis/json-rpc/
// - https://docs.web3js.org/api/web3-types/interface/BaseTransactionAPI
// - https://docs.metamask.io/wallet/reference/json-rpc-api/
export class BaseTransaction {
  public transaction: Partial<Transaction> = {}

  public constructor(params: Transaction) {
    if (params.type) {
      this.transaction.type = number.toBigInt(params.type)
    }
    if (params.nonce) {
      this.transaction.nonce = number.toBigInt(params.nonce)
    }
    if (params.to) {
      this.transaction.to = ethers.getAddress(params.to)
    }
    if (params.from) {
      this.transaction.from = ethers.getAddress(params.from)
    }
    if (params.gas) {
      this.transaction.gas = number.toBigInt(params.gas)
    }
    if (params.value) {
      this.transaction.value = number.toBigInt(params.value)
    }
    if (params.maxFeePerBlobGas) {
      this.transaction.maxFeePerBlobGas = number.toBigInt(
        params.maxFeePerBlobGas
      )
    }
    if (params.chainId) {
      this.transaction.chainId = number.toBigInt(params.chainId)
    }

    if (params.accessList) {
      this.transaction.accessList = params.accessList.map(
        ({ address, storageKeys }) => ({
          address: ethers.getAddress(address),
          storageKeys: storageKeys.map((key) => ethers.hexlify(key))
        })
      )
    }
    if (params.blobVersionedHashes) {
      this.transaction.blobVersionedHashes = params.blobVersionedHashes.map(
        (hash) => ethers.hexlify(hash)
      )
    }
    if (params.blobs) {
      this.transaction.blobs = params.blobs.map((blob) => ethers.hexlify(blob))
    }

    // Refer: https://github.com/ethereum/execution-apis/pull/201
    if (params.input) {
      this.transaction.input = ethers.hexlify(params.input)
      this.transaction.data = ethers.hexlify(params.input)
    } else if (params.data) {
      this.transaction.input = ethers.hexlify(params.data)
      this.transaction.data = ethers.hexlify(params.data)
    }

    // Refer: https://ethereum.org/en/developers/docs/gas/
    if (params.maxPriorityFeePerGas && params.maxFeePerGas) {
      this.transaction.gasPrice = null
      this.transaction.maxPriorityFeePerGas = number.toBigInt(
        params.maxPriorityFeePerGas
      )
      this.transaction.maxFeePerGas = number.toBigInt(params.maxFeePerGas)
    } else if (params.gasPrice) {
      this.transaction.gasPrice = number.toBigInt(params.gasPrice)
      this.transaction.maxPriorityFeePerGas = null
      this.transaction.maxFeePerGas = null
    }
  }

  public get type(): null | BigNumberish {
    return this.transaction.type
  }

  public get nonce(): null | BigNumberish {
    return this.transaction.nonce
  }

  public get to(): null | HexString {
    return this.transaction.to
  }
  public get from(): null | HexString {
    return this.transaction.from
  }

  public get gas(): null | BigNumberish {
    return this.transaction.gas
  }

  public get value(): null | BigNumberish {
    return this.transaction.value
  }

  public get input(): null | HexString {
    return this.transaction.input
  }

  public get gasPrice(): null | BigNumberish {
    return this.transaction.gasPrice
  }

  public get maxPriorityFeePerGas(): null | BigNumberish {
    return this.transaction.maxPriorityFeePerGas
  }

  public get maxFeePerGas(): null | BigNumberish {
    return this.transaction.maxFeePerGas
  }

  public get maxFeePerBlobGas(): null | BigNumberish {
    return this.transaction.maxFeePerBlobGas
  }

  public get accessList(): null | Array<AccessListEntry> {
    return this.transaction.accessList
  }

  public get blobVersionedHashes(): null | Array<HexString> {
    return this.transaction.blobVersionedHashes
  }

  public get blobs(): null | Array<HexString> {
    return this.transaction.blobs
  }

  public get chainId(): null | BigNumberish {
    return this.transaction.chainId
  }

  public get data(): null | HexString {
    return this.transaction.data
  }

  public params(): Transaction {
    return {
      type: this.transaction.type ? number.toHex(this.transaction.type) : null,
      nonce: this.transaction.nonce
        ? number.toHex(this.transaction.nonce)
        : null,
      gas: this.transaction.gas ? number.toHex(this.transaction.gas) : null,
      value: this.transaction.value
        ? number.toHex(this.transaction.value)
        : null,
      gasPrice: this.transaction.gasPrice
        ? number.toHex(this.transaction.gasPrice)
        : null,
      maxPriorityFeePerGas: this.transaction.maxPriorityFeePerGas
        ? number.toHex(this.transaction.maxPriorityFeePerGas)
        : null,
      maxFeePerGas: this.transaction.maxFeePerGas
        ? number.toHex(this.transaction.maxFeePerGas)
        : null,
      ...this.transaction
    }
  }
}

export class EthTransaction extends BaseTransaction {
  public isContractCreation() {
    return !this.transaction.to
  }

  public equalFrom(sender: HexString) {
    return this.transaction.from && this.transaction.from !== sender
  }
}
