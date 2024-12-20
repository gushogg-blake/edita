let _typeof = require("utils/typeof");
let chai = require("./chai");

let {assert, expect} = chai;

module.exports = {
	expect,
	
	is(a, b) {
		assert.strictEqual(a, b);
	},
	
	deep(a, b) {
		assert.deepEqual(a, b);
	},
	
	subset(a, b) {
		if (_typeof(a) === "Array") {
			if (a.length !== b.length) {
				throw new Error("subset - arrays are different lengths");
			}
			
			for (let i = 0; i < a.length; i++) {
				assert.containSubset(a[i], b[i]);
			}
		} else {
			assert.containSubset(a, b);
		}
	},
};
