# Results Demonstration and Reproduction Process

## Demo 1: Swap ETH for UNI tokens in the AA contract on the Sepolia testnet within the Uniswap DApp.

[![Waallet Demo](https://i.imgur.com/iEtCnl0.png)](https://youtu.be/PviRgMoooII)

### Reproduce the process

#### (1) Deploy your AA SimpleAccount contract

- Deploy this contract to Sepolia testnet in [Remix](https://remix.ethereum.org/) and execute the `createAccount(address owner, uint256 salt)` function.
- Note the `NewAccount` event to find the address of the deployed AA SimpleAccount contract.
- Also transfer 0.1 SepoliaETH to the SimpleAccount contract.

```typescript
// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.2 <0.9.0;

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
PLASMO_PUBLIC_SHIP_NAME=ncc-1701
PLASMO_PUBLIC_SHIELD_FREQUENCY=147
PLASMO_PUBLIC_SITE_URL=https://www.plasmo.com

PLASMO_PUBLIC_ACCOUNT=<YOUR_SIMPLE_ACCOUNT_ADDRESS>
PLASMO_PUBLIC_ACCOUNT_OWNER_PRIVATE_KEY=<YOUR_SIMPLE_ACCOUNT_OWNER_PRIVATE_KEY>
PLASMO_PUBLIC_NODE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
PLASMO_PUBLIC_BUNDLER_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>

CODE=PLASMO-GO-030 # Undefined in extension because it does not start with PLASMO_PUBLIC_
```

#### (4) Compile waallet-extension

- Compile waallet-extension and `Load unpacked` `build/chrome-mv3-dev/` directory in `Developer mode` in Chrome browser.
- Visit [Uniswap](https://app.uniswap.org/swap), click `Connect` and `Waallet` to complete the connection.
- Enter 0.01 ETH, press `Swap` and `Confirm Swap` to exchange for UNI tokens.
- Done!

```shell
npm run dev
```

## Demo 2: Transfer with SimpleAccount on Local Testnet

[![Waallet Demo](https://i.imgur.com/KOIudK8.png)](https://youtu.be/V3xA95UXuQo)

### Reproduce the process

- Currently in the Pull Request phase, stay tuned!

## Demo 3: Transfer with PasskeyAccount on Local Testnet

[![Waallet Demo](https://i.imgur.com/fMWz5X3.png)](https://youtu.be/5MlbRI152us)

### Reproduce the process

- Currently in the Pull Request phase, stay tuned!
