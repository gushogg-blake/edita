let chai = require("chai");
let chaiSubset = require("chai-subset");

chai.use(chaiSubset);

let {assert} = chai;

let assertions = {
	is(a, b) {
		assert.strictEqual(a, b);
	},
	
	deep(a, b) {
		assert.deepEqual(a, b);
	},
	
	subset(a, b) {
		assert.containSubset(a, b);
	},
};

module.exports = assertions;
