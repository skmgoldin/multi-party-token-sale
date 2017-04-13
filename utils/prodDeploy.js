const AWS = require(`aws-sdk`);
const fs = require(`fs`);
const childProcess = require(`child_process`);
const utils = require(`./utils.js`);

const secrets = JSON.parse(fs.readFileSync(`secrets.json`));

const s3Params = {
  accessKeyId: secrets.s3.keyID,
  secretAccessKey: secrets.s3.accessKey,
};

const uploadParams = {
  Bucket: `test`,
  ACL: `public-read`,
  Body: ``
};

childProcess.execSync(`rm -rf build`);
const compiler = childProcess.exec(`truffle compile`, (err) => {
  if (err) { console.error(err); }

  const saleArtifact = JSON.parse(fs.readFileSync(`build/contracts/Sale.json`));
  const saleParams = uploadParams;

  saleParams.Key = `Sale.json`;
  saleParams.Body = JSON.stringify(saleArtifact, null, `  `);

  const s3 = new AWS.S3(s3Params);
  s3.upload(saleParams, (err, data) => {
    if (err) { console.log(err); } else { console.log(`uploaded sale artifact to s3!`); }
  });

  const deployer = childProcess.exec(`truffle migrate --network ropsten`, (err) => {
    if (err) { console.error(err); }
    const sellers = utils.getSellers();
    const addrsParams = uploadParams;

    const saleAddrs = {};
    sellers.forEach(function(e) {
      saleAddrs[e.id] = e.sale.address;
    });

    addrsParams.Key = `saleAddrs.json`;
    addrsParams.Body = JSON.stringify(saleAddrs, null, `  `);

    const s3 = new AWS.S3(s3Params);
    s3.upload(addrsParams, (err, data) => {
      if (err) { console.log(err); } else { console.log(`uploaded addrs to s3!`); }
    });
  });

  deployer.stdout.on(`data`, (chunk) => process.stdout.write(chunk.toString(`utf8`)));
  deployer.stderr.on(`data`, (chunk) => process.stderr.write(chunk.toString(`utf8`)));
});

compiler.stdout.on(`data`, (chunk) => process.stdout.write(chunk.toString(`utf8`)));
compiler.stderr.on(`data`, (chunk) => process.stderr.write(chunk.toString(`utf8`)));

