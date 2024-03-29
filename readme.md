## Segwit Testnet bitcoin

This app will create a new segwit address and send the unspent transaction to another segwit address.

## Getting Started

### Installation

Please DO NOT use `npm install`.

```
yarn install
```

```
cd ios && pod install && cd ..
```

```
yarn postinstall
```

## Library

- [rn-bitcoinjs-lib](https://github.com/coreyphillips/rn-bitcoinjs-lib) (To generate a P2SH Segwit keypair)

## API

I have used [SoChain](https://chain.so/testnet/btc) API for fetching the transactions for the address and the available unspent bitcoin balance at that address.

To sign and broadcast a transaction to another Segwit address, I'm using [smartbit](https://www.smartbit.com.au/)

### Screenshots

<p align="center">
  <img src="./screenshots/screenshot1.png" alt="Sublime's custom image" height="350" style="padding: 10px;"/>
  <img src="./screenshots/screenshot2.png" alt="Sublime's custom image" height="350" style="padding: 10px;"/>
  <img src="./screenshots/screenshot3.png" alt="Sublime's custom image" height="350" style="padding: 10px;"/>
  <img src="./screenshots/screenshot6.png" alt="Sublime's custom image" height="350" style="padding: 10px;"/>
</p>
