let {is, deep} = require("./testUtils/assertions");
let fs = require("..");
let mkdirp = require("../mkdirp");

describe("rename", function() {
	let files = fs(__dirname).rel("./files/rename");
	
	before(async function() {
		await files.mkdirp();
	});
	
	after(async function() {
		await files.delete();
	});
	
	it("sibling", async function() {
		let file = files.child("a");
		
		await file.write("a");
		
		await file.rename("b");
		
		is((await files.child("b").read()), "a");
		
		await file.delete();
	});
});
