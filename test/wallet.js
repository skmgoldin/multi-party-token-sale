/*global describe before artifacts assert it contract:true*/
const utils = require(`../utils/utils.js`);
const Eth = require(`ethjs-query`);
const HttpProvider = require(`ethjs-provider-http`);
const eth = new Eth(new HttpProvider(`http://localhost:8545`));

const Sale = artifacts.require(`./Sale.sol`);
const Wallet = artifacts.require(`./MultiSigWallet.sol`);

contract(`Wallet`, (accounts) => {
  const sellers = utils.getSellers();
  const [james, miguel, edwin] = accounts;


  let totalInWallet;
  sellers.forEach((seller) => {
    let sale;

    before(`initialize Wallet instance`, () =>
      Sale.at(seller.sale.address)
      .then((instance) => {
        sale = instance;
        return eth.getBalance(seller.wallet.address)
      })
      .then((balance) => {
        totalInWallet = balance.toNumber();
        return new Promise((resolve) => resolve(undefined));
      })
      .catch((err) => { throw (err); })
    );

    it(`${seller.id} should add ${1 * seller.sale.price} Wei to the wallet`, () =>
      sale.purchaseToken(1, {from: james, value: seller.sale.price})
      .then(() => eth.getBalance(seller.wallet.address))
      .then((balance) => {
        totalInWallet += 1 * seller.sale.price;
        assert.equal(balance, totalInWallet);
      })
      .catch((err) => {
        throw (err);
      })
    );

    it(`${seller.id} should add ${50 * seller.sale.price} Wei to the wallet`, () =>
      sale.purchaseToken(50, {from: miguel, value: seller.sale.price * 50})
      .then(() => eth.getBalance(seller.wallet.address))
      .then((balance) => {
        totalInWallet += 50 * seller.sale.price;
        assert.equal(balance, totalInWallet);
      })
      .catch((err) => {
        throw (err);
      })
    );

    it(`${seller.id} should add 0 Wei to the wallet`, () =>
      sale.purchaseToken(seller.sale.quantity, {from: edwin,
        value: seller.sale.price * seller.sale.quantity})
      .then(() => eth.getBalance(seller.wallet.address))
      .then((balance) => assert.equal(balance, seller.sale.price * 51))
      .catch((expectedThrow) => {
        if (!utils.isSolidityThrow(expectedThrow)) { throw (expectedThrow); }
        return eth.getBalance(seller.wallet.address);
      })
      .then((balance) => assert.equal(balance, totalInWallet))
      .catch((err) => { throw (err); })
    );
  });
});

