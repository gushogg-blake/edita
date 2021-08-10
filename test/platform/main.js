let TreeSitter = require("web-tree-sitter");
let App = require("../../src/modules/App");
let Platform = require("./Platform");
let Base = require("./Base");

global.TreeSitter = TreeSitter;

global.platform = new Platform();
global.base = new Base();

before(async function() {
	await base.init();
});
