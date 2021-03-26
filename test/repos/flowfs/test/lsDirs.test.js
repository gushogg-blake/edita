let {is, deep} = require("./testUtils/assertions");
let fs = require("..");

describe("lsDirs", function() {
	let testDir = fs(__dirname).child("files/lsDirs");
	
	it("lsDirs", async function() {
		deep((await testDir.lsDirs()).map(n => n.name), ["dir1", "dir2"]);
	});
});
