let a = require("assert");
let {is, deep} = require("./testUtils/assertions");
let fs = require("..");

describe("constructing with multiple path args", function() {
	it("1", async function() {
		let f = fs("/a", "b");
		
		is(f.path, "/a/b");
	});
	
	it("2", async function() {
		let f = fs("/a", "b", "c");
		
		is(f.path, "/a/b/c");
	});
});
