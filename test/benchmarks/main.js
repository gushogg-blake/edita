let TreeSitter = require("web-tree-sitter");
let App = require("modules/App");
let Base = require("modules/Base");
let Platform = require("../platform/Platform");

module.exports = async function(fn) {
	global.TreeSitter = TreeSitter;
	
	await TreeSitter.init();
	
	global.platform = new Platform();
	global.base = new Base();
	
	await platform.init();
	await base.init();
	
	fn();
}
