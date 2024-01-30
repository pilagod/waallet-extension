# Results Demonstration and Reproduction Process

## Demo 1: Swap ETH for UNI tokens in the AA contract on the Sepolia testnet within the Uniswap DApp.

[![Waallet Demo](https://i.imgur.com/f1QHreR.gif)](https://youtu.be/PviRgMoooII)

### Reproduce the process

#### (1) Deploy your AA SimpleAccount contract

- Deploy this contract to Sepolia testnet in [Remix](https://remix.ethereum.org/) and execute the `createAccount(address owner, uint256 salt)` function.
- Note the `NewAccount` event to find the address of the deployed AA SimpleAccount contract.
- Remember to transfer some SepoliaETH (0.1 or so) to the SimpleAccount contract.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IEntryPoint} from "https://github.com/eth-infinitism/account-abstraction/blob/v0.6.0/contracts/interfaces/IEntryPoint.sol";
import {SimpleAccountFactory} from "https://github.com/eth-infinitism/account-abstraction/blob/v0.6.0/contracts/samples/SimpleAccountFactory.sol";
import {SimpleAccount} from "https://github.com/eth-infinitism/account-abstraction/blob/v0.6.0/contracts/samples/SimpleAccount.sol";

contract DeployAccount {
    IEntryPoint entryPoint = IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);
    SimpleAccountFactory accountFactory = new SimpleAccountFactory(entryPoint);

    event NewAccount(address indexed account, address indexed accountFactory);

    function createAccount(address owner,uint256 salt) public {
        SimpleAccount account = accountFactory.createAccount(owner, salt);
        emit NewAccount(address(account), address(accountFactory));
    }

    function getAddress(address owner,uint256 salt) public view returns (address) {
        return accountFactory.getAddress(owner, salt);
    }
}
```

#### (2) Download and compile the waallet-extension project

- Download the waallet-extension project and its dependencies.

```shell
### Download the waallet-extension project and its dependencies.
git clone git@github.com:pilagod/waallet-extension.git
cd waallet-extension/
git switch --detach uniswap-swap
npm install

### Edit the .env file's environment variables.
cp .env.example .env
vim .env
```

#### (3) Edit the .env file's environment variables.

```shell
PLASMO_PUBLIC_ACCOUNT=<YOUR_SIMPLE_ACCOUNT_ADDRESS>
PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY=<YOUR_SIMPLE_ACCOUNT_OWNER_PRIVATE_KEY>
PLASMO_PUBLIC_NODE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
PLASMO_PUBLIC_BUNDLER_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
```

#### (4) Compile waallet-extension

- Compile waallet-extension and `Load unpacked` `build/chrome-mv3-dev/` directory in `Developer mode` in Chrome browser.
- Visit [Uniswap](https://app.uniswap.org/swap), click `Connect` and `Waallet` to complete the connection.
- Enter 0.01 ETH, press `Swap` and `Confirm Swap` to exchange for UNI tokens.
- Done!

```shell
npm run dev
```

## Demo 2: Swap ETH for UNI tokens with passkey verification in the AA contract on the Sepolia testnet within the Uniswap DApp.

[![Waallet Demo](https://i.imgur.com/rOdWAJG.gif)](https://youtu.be/Ac2jmmAEG00)

### Reproduce the process

#### (1) Deploy your AA PasskeyAccount contract

- Deploy your PasskeyAccount on Sepolia testnet using the script in [waallet-contract](https://github.com/pilagod/waallet-contract/blob/uniswap-swap-passkey/README.md#appendix-deploy-and-verify-passkeyaccount-on-sepolia-testnet)'s appendix.

#### (2) Download and compile the waallet-extension project

- Follow Demo 1, [step (2)](#2-download-and-compile-the-waallet-extension-project) to download and compile the waallet-extension project, but remember to `git switch` to the `uniswap-swap-passkey` tag.

```shell
### ...
git switch --detach uniswap-swap-passkey
### ...
```

#### (3) Edit the .env file's environment variables.

- Remember to comment out PLASMO_PUBLIC_ACCOUNT and PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY to make waallet-extension [use PasskeyAccount](https://github.com/pilagod/waallet-extension/blob/uniswap-swap-passkey/background/index.ts#L24) as the default account.

```shell
#PLASMO_PUBLIC_ACCOUNT=<YOUR_SIMPLE_ACCOUNT_ADDRESS>
#PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY=<YOUR_SIMPLE_ACCOUNT_OWNER_PRIVATE_KEY>
PLASMO_PUBLIC_NODE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
PLASMO_PUBLIC_BUNDLER_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>

PLASMO_PUBLIC_PASSKEY_ACCOUNT=<YOUR_PASSKEY_ACCOUNT_ADDRESS>
```

#### (4) Compile waallet-extension

- Follow Demo 1, [step (4)](#4-compile-waallet-extension): transfer enough ETH to PasskeyAccount, compile waallet-extension, then go to Uniswap for UNI token exchange.

```shell
npm run dev
```

## Demo 3: Transfer with SimpleAccount on Local Testnet

[![Waallet Demo](https://i.imgur.com/dKjIltD.gif)](https://youtu.be/V3xA95UXuQo)

## Demo 4: Transfer with PasskeyAccount on Local Testnet

[![Waallet Demo](https://i.imgur.com/UgYa0QR.gif)](https://youtu.be/5MlbRI152us)
