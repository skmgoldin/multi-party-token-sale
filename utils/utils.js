const fs = require(`fs`);

const pathPrefix = `input/`;
const pathSuffix = `.json`;

const sellerIDs = [
  `alice`,
  `bob`,
  `charlie`
];

module.exports = {
  getSellers: (() =>
    sellerIDs.map((sellerID) =>
      JSON.parse(fs.readFileSync(`${pathPrefix}${sellerID}${pathSuffix}`))
    )
  ),
  writeSellers: ((...sellers) =>
    sellers.map((seller) => {
      const writableSeller = JSON.stringify(seller, null, `  `);
      const writePath = `${pathPrefix}${seller.id}${pathSuffix}`;
      fs.writeFileSync(writePath, writableSeller);
      return writePath;
    })
  ),
  getConstants: (() => JSON.parse(fs.readFileSync(`${pathPrefix}constants${pathSuffix}`))),
  isSolidityThrow: ((err) => {
    if (err.toString().includes(`invalid JUMP`)) { return true; } else { return false; }
  })
};
