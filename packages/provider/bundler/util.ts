import * as ethers from "ethers"

import type { BigNumberish, HexString } from "~typing"

import type { UserOperation } from "./index"

export async function getUserOpHash(
  userOp: UserOperation,
  entryPointAddress: HexString,
  chainId: BigNumberish
) {
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
      userOp.sender,
      userOp.nonce,
      ethers.keccak256(userOp.initCode),
      ethers.keccak256(userOp.callData),
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      ethers.keccak256(userOp.paymasterAndData)
    ]
  )
  return ethers.keccak256(
    abiCoder.encode(
      ["bytes32", "address", "uint256"],
      [ethers.keccak256(userOpPacked), entryPointAddress, chainId]
    )
  )
}
