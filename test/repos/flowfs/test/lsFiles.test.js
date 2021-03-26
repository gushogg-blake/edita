let {is, deep} = require("./testUtils/assertions");
let fs = require("..");

describe("lsFiles", function() {
	let testDir = fs(__dirname).child("files");
	
	it("lsFiles", async function() {
		deep((await testDir.lsFiles()).map(n => n.name), ["file1", "file2"]);
	});
});
