/*global artifacts:true*/
const utils = require(`../utils/utils.js`);
const Sale = artifacts.require(`./Sale.sol`);
const Wallet = artifacts.require(`./MultiSigWallet.sol`);

function initializeAccounts(network, _accounts) {
  const sellers = utils.getSellers();

  if (network === `development` || network === `ropsten` || network === `kovan`) {
    sellers.map((seller) => {
      seller.prod = false;
      if (seller.wallet.multisig !== undefined) {
        seller.wallet.multisig.owners = [
          _accounts[0],
          _accounts[1],
          _accounts[2]
        ];
      }
      return seller;
    });
  }

  if (network === `mainnet`) {
    sellers.map((seller) => {
      if (seller.prod === false) {
        throw new Error(`The addrs in ${seller.id}.json were recently ` +
        `overwritten in dev testing. Double check whether they are correct ` +
        `and set prod to true.`);
      }
      return seller;
    });
  }

  return sellers;
}

function resolveProxies(sellers) {
  const linkedSellers = sellers.map((seller) => {
    if (seller.wallet.proxy !== undefined) {
      const proxy = sellers.find((e) => e.id === seller.wallet.proxy);
      seller.wallet.address = proxy.wallet.address;
    }
    return seller;
  });

  if (linkedSellers.find((e) =>
    e.wallet.address === undefined && e.wallet.proxy !== undefined
  ) !== undefined) {
    return resolveProxies(linkedSellers);
  } else {
    return linkedSellers;
  }
}

function validateInputs(sellers) {
  sellers.forEach((seller) => {
    if (seller.wallet.multisig !== undefined && seller.wallet.proxy !== undefined) {
      throw new Error(`${seller.id} specifies both a multisig deployment and a ` +
        `proxy wallet. Only one can be specified.`);
    }
    if (seller.wallet.multisig !== undefined || seller.wallet.proxy !== undefined) {
      seller.wallet.address = undefined;
    }
  });
  return sellers;
}

module.exports = ((deployer, network, _accounts) =>
  deployer.then(() => { // Deploy wallets
    const sellers = validateInputs(initializeAccounts(network, _accounts));
    return Promise.all(sellers.map((seller) => {
      if (seller.wallet.multisig !== undefined) {
        return Wallet.new(
          seller.wallet.multisig.owners, 
          seller.wallet.multisig.confirmations
        )
        .then((instance) => {
          console.log(`  Deployed ${seller.id} multisig`);
          seller.wallet.address = instance.address;
          return new Promise((resolve) => resolve(seller));
        });
      }
      return new Promise((resolve) => resolve(seller));
    }));
  })
  .then((sellers) => { // Resolve proxies
    const linkedSellers = resolveProxies(sellers);
    console.log(`  Resolved proxies`);
    return Promise.all(linkedSellers.map((seller) => // Deploy sale contracts
      Sale.new(seller.sale.owner, seller.wallet.address,
        seller.sale.price, seller.sale.quantity)
      .then((instance) => {
        console.log(`  Deployed ${seller.id} sale contract`);
        seller.sale.address = instance.address;
        return new Promise((resolve) => resolve(seller));
      })
    ));
  })
  .then((sellers) =>  // Persist data
     new Promise((resolve) => resolve(utils.writeSellers(...sellers)))
  )
)

