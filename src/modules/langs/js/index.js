let codeIntel = require("./codeIntel");
let parse = require("./parse");

module.exports = {
	code: "js",
	codeIntel,
	
	async init() {
		let parser = new TreeSitter();
		let old = window.process;
		window.process = {};
		console.log("ASD");
		//let JavaScript = await TreeSitter.Language.load("javascript.wasm");
		console.log("ASD3");
		window.process = old;
		
		//parser.setLanguage(JavaScript);
		
		this.parse = parse(parser);
	},
};
