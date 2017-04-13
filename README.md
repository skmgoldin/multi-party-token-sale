# A Multi-Party Token Sale

## Setup
```
npm install -g truffle ethereumjs-testrpc
npm install
truffle compile
```
The deployer is going to look for four uncommitted files in an uncommitted directory called `input` (which is to say: you have to add these things manually). It will look for files called `alice.json`, `bob.json`, `charlie.json` and `constants.json`. See the input files section.

## Run tests

In a separate terminal window, run the `testrpc`. Then in the project repo, run `truffle test`. If you want to test on Kovan or some other testnet, run a node with the RPC open to `localhost:8545` and get ready to sign a bunch of transactions. :)

## Deploy contracts

To deploy you'll need to be running a node on the network you want to deploy to with a funded default account. At the default gas price it takes about 0.435 Ether to deploy both sales and their wallets.

To deploy, run `truffle migrate --network <development | ropsten | kovan | mainnet>`. 

The inputs in the `input` directory will be appended with deployed addresses after running the migration.

To deploy for production with our frontend, run `node utils/prodDeploy.js`. You'll need a valid `secrets.json` file.


## Input files

The Alice, Bob and Charlie input files should be of the form:
```
{
  "id": <"alice"|"bob">,
  "wallet": {
    <"multisig": {
      "owners": [
        "address0",
        "address1",
        "address2",
        ...
        "addressN"
      ],
      "confirmations": <a number <= N>
    }>
    <"proxy": <id of another seller>>
    <"address": <a raw Ethereum address>>
  }
  "sale": {
    "price": <a price in wei>,
    "owner": <an ethereum address>,
    "quantity": <a quantity of tokens to sell>
  }
}
```
The deployer will add some fields to these files after ingesting them. Deployed addresses for the sale contracts will be appended. If multisig contracts are specified for deployment, their deployed addresses will be appended as well. If the wallet is specified to proxy to the address of another seller's wallet, that resolved proxy address will be appended. If a raw Ethereum address is provided for a wallet, that will be left as is. A flag `prod` will be appended; the `prod` flag will be set to `false` after running deployments through anything other than the `mainnet` network, and if you try to deploy on `mainnet` while `prod` is `false` an error will be thrown warning you to double check that the `multisig` `owners` addresses are correct and then to manually set `prod` to `true`. When running on any of the non-`mainnet` networks, the deployer will overwrite your multisig owner addresses with ones controlled by your local RPC so it can run tests against the deployments.

The constants file should be of the form:
```
{
  totalTokens: <The total number of pre-mine tokens to distribute>
}
```
The sums of the `sale.quantity` properties for each `seller` input must sum to the `totalTokens` constant (`TODO`: presently this isn't actually checked).

