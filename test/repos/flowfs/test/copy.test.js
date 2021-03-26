let {is, deep} = require("./testUtils/assertions");
let fs = require("..");

describe("copy", function() {
	let testDir = fs(__dirname).child("files");
	
	it("copy", async function() {
		let source = testDir.child("copy");
		let dest = source.sibling("copyTest");
		
		await source.copy(dest);
		
		let files = await dest.glob("**/*");
		
		deep(files.map(n => n.pathFrom(dest)), ["dir", "dir/file", "file"]);
		
		await dest.rmrf();
	});
});
