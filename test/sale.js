/*global web3 describe before artifacts assert it contract:true*/
const utils = require(`../utils/utils.js`);
const Sale = artifacts.require(`./Sale.sol`);
const Wallet = artifacts.require(`./MultiSigWallet.sol`);

contract(`Sale`, (accounts) => {
  const sellers = utils.getSellers();
  const [james, miguel, edwin] = accounts;
  const constants = utils.getConstants();
  
  it(`should instantiate with the total sellable tokens in both sale contracts ` +
    `equaling exactly the total provided in the constants file.`, () => {
    let saleQuantity = 0;
    sellers.forEach(function(seller) { saleQuantity += seller.sale.quantity;});
    assert.equal(saleQuantity, constants.totalTokens);
  });

  sellers.forEach((seller) => {
    let sale;

    before(`initialize Sale instance`, () =>
      Sale.at(seller.sale.address).then((instance) => {
        sale = instance;
      })
    );

    it(`${seller.id}: should instantiate with the owner set to ${seller.sale.owner}`, () =>
      sale.owner.call().then((owner) => assert.equal(owner, seller.sale.owner.toLowerCase()))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should instantiate with the price set to ${seller.sale.price}`, () =>
      sale.price.call().then((price) =>
        assert.equal(price, seller.sale.price))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should instantiate with total sellable tokens set to ` +
      `${seller.sale.quantity}`, () =>
      sale.tokensRemaining.call().then((tokensRemaining) =>
        assert.equal(tokensRemaining, seller.sale.quantity))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should instantiate with the wallet address set to ` +
      `${seller.wallet.address}`, () =>
      sale.wallet.call().then((storedAddr) => {
        assert.equal(storedAddr, seller.wallet.address.toLowerCase());
        return;
      })
      .catch((err) => { throw (err); })
    );

    const jamesPurchase = 1;
    const miguelPurchase = 50;
    const totalPurchased = jamesPurchase + miguelPurchase;
    it(`${seller.id}: should transfer ${jamesPurchase} tokens to James`, () =>
      sale.purchaseToken(jamesPurchase, {from: james,
        value: seller.sale.price * jamesPurchase})
      .then(() => sale.purchaseRecords.call(james))
      .then((balance) => assert.equal(balance, jamesPurchase))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should decrement the total available supply by ${jamesPurchase} ` +
      `after transferring to James`, () =>
      sale.tokensRemaining.call().then((tokensRemaining) =>
        assert.equal(tokensRemaining, seller.sale.quantity - jamesPurchase))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should transfer ${miguelPurchase} tokens to Miguel`, () =>
      sale.purchaseToken(miguelPurchase, {from: miguel,
        value: seller.sale.price * miguelPurchase})
      .then((res) => sale.purchaseRecords.call(miguel))
      .then((balance) => assert.equal(balance, miguelPurchase))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should decrement the total available supply by ${totalPurchased} `
      + `after transferring to James and Miguel`, () =>
      sale.tokensRemaining.call().then((tokensRemaining) =>
        assert.equal(tokensRemaining,
        seller.sale.quantity - totalPurchased))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should not transfer ${seller.sale.quantity} tokens to Edwin, ` +
      `because that would mean ${totalPurchased} more tokens had been sold than ` +
      `were available in the total initial supply`, () =>
      sale.purchaseToken(seller.sale.quantity,
        {from: edwin, value: seller.sale.price * seller.sale.quantity})
      .then(() =>
        sale.purchaseRecords.call(edwin).then((balance) =>
        assert.equal(balance, 0)))
      .catch((expectedThrow) => {
        if (!utils.isSolidityThrow(expectedThrow)) { throw (expectedThrow); }
        return sale.purchaseRecords.call(edwin);
      })
      .then((balance) => assert.equal(balance, 0))
      .catch((err) => { throw (err); })
    );

    it(`${seller.id}: should not accept a raw send that does not use the purchaseToken ` +
      `function.`, () =>
      sale.sendTransaction({value: web3.toWei(5, `ether`), from: edwin})
      .then(() => sale.purchaseRecords.call(edwin)
      .then((balance) => assert.equal(balance, 0)))
      .catch((expectedThrow) => {
        if (!utils.isSolidityThrow(expectedThrow)) { throw (expectedThrow); }
        return sale.purchaseRecords.call(edwin);
      })
      .then((balance) => assert.equal(balance, 0))
      .catch((err) => { throw (err); })
    );
  });
});

