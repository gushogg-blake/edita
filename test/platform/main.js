let TreeSitter = require("tree-sitter");
let Platform = require("./Platform");
let App = require("./App");

global.TreeSitter = TreeSitter;

global.platform = new Platform();

before(async function() {
	let app = new App();
	
	await app.init();
	
	global.app = app;
});
