let chai = require("chai");
let chaiSubset = require("chai-subset");

chai.use(chaiSubset);

chai.config.truncateThreshold = 0;

module.exports = chai;
