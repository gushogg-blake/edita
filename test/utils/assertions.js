let {assert} = require("chai");
let normaliseString = require("./normaliseString");

let assertions = {
	is(a, b) {
		//if (typeof a === "string") {
		//	a = normaliseString(a);
		//	b = normaliseString(b);
		//}
		
		assert.strictEqual(a, b);
	},
	
	isnt(a, b) {
		//if (typeof a === "string") {
		//	a = normaliseString(a);
		//	b = normaliseString(b);
		//}
		
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
