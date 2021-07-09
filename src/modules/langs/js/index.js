let codeIntel = require("./codeIntel");
let parse = require("./parse");

module.exports = {
	code: "js",
	codeIntel,
	parse,//
	
	async init() {
		console.log("INT");
		let parser = new TreeSitter();
		
		let JavaScript = await TreeSitter.Language.load("src/tree-sitter-javascript.wasm");
		
		parser.setLanguage(JavaScript);
		
		this.parse = parse(parser);
		console.log(this.parse);
	},
};
