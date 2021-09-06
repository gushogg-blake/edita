let TreeSitter = require("web-tree-sitter");
let App = require("modules/App");
let Base = require("modules/Base");
let Platform = require("./Platform");

exports.mochaHooks = {
	async beforeAll(done) {
		global.TreeSitter = TreeSitter;
		
		global.platform = new Platform();
		global.base = new Base();
		
		await platform.init();
		await base.init();
		
		done();
	},
};
