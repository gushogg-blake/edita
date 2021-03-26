let assert = require("assert");
let normaliseString = require("./normaliseString");

module.exports = {
	is(a, b) {
		if (typeof a === "string") {
			a = normaliseString(a);
			b = normaliseString(b);
		}
		
		assert.strictEqual(a, b);
	},
	
	deep(a, b) {
		assert.deepStrictEqual(a, b);
	},
};
