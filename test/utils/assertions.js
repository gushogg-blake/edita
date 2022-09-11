let {assert} = require("chai");

let assertions = {
	is(a, b) {
		assert.strictEqual(a, b);
	},
	
	isnt(a, b) {
		assert.notStrictEqual(a, b);
	},
	
	deep(a, b) {
		assert.deepEqual(a, b);
	},
	
	/*
	for when the object has some properties that we're not interested in
	*/
	
	subset(obj, props) {
		for (let prop in props) {
			assertions.deep(obj[prop], props[prop]);
		}
	},
};

module.exports = assertions;
