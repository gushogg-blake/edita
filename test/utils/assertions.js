let {assert} = require("chai");

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
