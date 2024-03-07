import * as ethers from "ethers"

import config from "~config/test"
import type { AccountFactory } from "~packages/account/factory"
import imAccountMetadata from "~packages/account/imAccount/abis/imAccount.json"
import imAccountFactoryMetadata from "~packages/account/imAccount/abis/imAccountFactory.json"
import { Validator, ValidatorType } from "~packages/account/imAccount/validator"
import { ECDSAValidator } from "~packages/account/imAccount/validators/ecdsaValidator"
import type { BigNumberish, HexString } from "~typing"

type CreateAccount = {
  initializer: HexString
  salt: BigNumberish
}

export class imAccountFactory implements AccountFactory {
  private node: ethers.JsonRpcProvider

  private factory: ethers.Contract
  private factoryOwner: ethers.Wallet
  private imAccount: ethers.Contract
  private ownerInfo: HexString
  private owneKeyInfo: string
  private salt: BigNumberish
  private entryPointAddress: string
  private fallbackHandlerAddress: string
  private validator: Validator

  public constructor(opts: {
    ownerInfo: string
    ownerKeyInfo: string
    factoryAddress: string
    implementationAddress: string
    entryPointAddress: string
    validatorType: ValidatorType
    validatorAddress: string
    fallbackHandlerAddress: string
    salt: BigNumberish
    nodeRpcUrl: string
  }) {
    this.node = new ethers.JsonRpcProvider(opts.nodeRpcUrl)
    this.ownerInfo = opts.ownerInfo
    this.owneKeyInfo = opts.ownerKeyInfo
    this.factory = new ethers.Contract(
      opts.factoryAddress,
      imAccountFactoryMetadata.abi,
      this.node
    )
    this.factoryOwner = new ethers.Wallet(config.account.operator.privateKey) // We need a factory signing server in the future
    this.imAccount = new ethers.Contract(
      opts.implementationAddress,
      imAccountMetadata.abi,
      this.node
    )
    this.entryPointAddress = opts.entryPointAddress
    this.setCurrentValidator(opts.validatorType, opts.validatorAddress)
    this.fallbackHandlerAddress = opts.fallbackHandlerAddress
    this.salt = opts.salt
  }

  public async getAddress() {
    return ethers.zeroPadValue(
      ethers.stripZerosLeft(
        // The name of `getAddress` conflicts with the function on ethers.Contract.
        // So we build call data from interface and directly send through node rpc provider.
        await this.node.call(
          await this.factory
            .getFunction("getAddress")
            .populateTransaction(this.salt)
        )
      ),
      20
    )
  }

  public async getInitCode() {
    const initializer = await this.getInitializer()
    const createAccountRequest = {
      initializer: initializer,
      salt: this.salt
    }
    // TODO: r, s, v not vrs
    const signature = await this.signCreateAccount(createAccountRequest)
    console.log("signature: ", signature)

    const params = this.factory.interface.encodeFunctionData(
      "createAccountWithSignature",
      [createAccountRequest, signature]
    )
    return ethers.concat([await this.factory.getAddress(), params])
  }

  public async getInitializer() {
    const ownerValidatorInitData =
      await this.validator.getOwnerValidatorInitData(this.ownerInfo)
    const { data } = await this.imAccount
      .getFunction("initialize")
      .populateTransaction(
        this.entryPointAddress,
        this.fallbackHandlerAddress,
        this.validator.getAddress(),
        ownerValidatorInitData
      )
    return data
  }

  public async signCreateAccount(createAccountRequest: CreateAccount) {
    const EIP712_DOMAIN_HASH = ethers.keccak256(
      ethers.toUtf8Bytes(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
      )
    )
    const nameHash = ethers.keccak256(ethers.toUtf8Bytes("imAccountFactory"))
    const versionHash = ethers.keccak256(ethers.toUtf8Bytes("v0"))
    const chainId = this.node._network.chainId
    const verifyingContractAddress = await this.factory.getAddress()
    const CREATE_REQUEST_TYPE_HASH = ethers.keccak256(
      ethers.toUtf8Bytes("CreateAccount(bytes initializer,uint256 salt)")
    )

    const domainSeperator = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"],
        [
          EIP712_DOMAIN_HASH,
          nameHash,
          versionHash,
          chainId,
          verifyingContractAddress
        ]
      )
    )

    const createAccountHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "bytes", "uint256"],
        [
          CREATE_REQUEST_TYPE_HASH,
          createAccountRequest.initializer,
          createAccountRequest.salt
        ]
      )
    )

    const signingHash = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes", "bytes32", "bytes32"],
        [ethers.toUtf8Bytes("\x19\x01"), domainSeperator, createAccountHash]
      )
    )
    const signatureObj = this.factoryOwner.signingKey.sign(signingHash)
    const signature = ethers.solidityPacked(
      ["bytes32", "bytes32", "uint8"],
      [signatureObj.r, signatureObj.s, signatureObj.v]
    )
    return signature
  }

  public setCurrentValidator(
    validatorType: ValidatorType,
    validatorAddress: string
  ) {
    if (validatorType == ValidatorType.ECDSAValidator) {
      this.validator = new ECDSAValidator({
        address: validatorAddress,
        ownerPrivateKey: this.owneKeyInfo,
        node: this.node
      })
    } else if (validatorType == ValidatorType.MultiSigValidator) {
    } else if (validatorType == ValidatorType.WebAuthnValidator) {
    } else {
      throw Error()
    }
  }
}
