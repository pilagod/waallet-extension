# Waallet Extension

## Demo

> This showcase swaps on Uniswap with a Passkey-verified account contract.

[![Waallet Demo](https://i.imgur.com/ojApmiQ.gif)](https://youtu.be/9D5K4IlofLY)

## Testing

This project depends on [waallet-contract](https://github.com/pilagod/waallet-contract) to provide the network environment, please follow the instructions in the repository to setup local testnet.

After you spin up a testnet from [waallet-contract](https://github.com/pilagod/waallet-contract), run the following command to do testing:

```bash
npm run test
```

## Extension

> [!NOTE]  
> This project is bootstrapped with [Plasmo](https://docs.plasmo.com/).

### Prepare Environment Variables

Please refer to `.env.development.example` and prepare your own `.env.development`.

### Load Extension into Browser

First, run Plasmo development server:

```bash
npm run dev
```

Open your browser, goto extension management page, and load `build/chrome-mv3-dev` by `Load unpacked` button. All code changes will be watched by Plasmo development server, and outcomes will be automatically reflected to the extension on your browser.

For further development guidance, please [visit Plasmo documentation](https://docs.plasmo.com/).

> [!TIP]
> Testnet from [waallet-contract](https://github.com/pilagod/waallet-contract) can help you testing the extension. You can also import funded accounts pre-deployed in the testnet to the extension via environment variables.

> [!TIP]
> There is another repository [waallet-dapp](https://github.com/pilagod/waallet-dapp) to help you simulating DApp interaction with the extension.

## Contributors

Special thanks to [Andy Chien](https://www.linkedin.com/in/chih-wei-chien/) for the fabulous UI/UX design. 🎨
