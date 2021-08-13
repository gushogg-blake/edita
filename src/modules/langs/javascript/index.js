let astMode = require("./astMode");
let codeIntel = require("./codeIntel");
let parse = require("./parse");

let wordRe = /\w/;

class JavaScript {
	constructor() {
		this.code = "javascript";
		this.name = "JavaScript";
		this.astMode = astMode;
		this.codeIntel = codeIntel;
	}
	
	async init() {
		this.parse = await parse(this);
	}
	
	getHiliteClass(node) {
		let {type} = node;
		
		if ([
			"identifier",
			"property_identifier",
			"shorthand_property_identifier",
			"shorthand_property_identifier_pattern",
		].includes(type)) {
			return "id";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (type === "string" || type === "template_string") {
			return "string";
		}
		
		if (type === "number") {
			return "number";
		}
		
		if (type === "regex") {
			return "regex";
		}
		
		if ("(){}[]".includes(type) || type === "${") {
			return "bracket";
		}
		
		if (type[0].match(wordRe)) {
			return "keyword";
		}
		
		return "symbol";
	}
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"js",
			"cjs",
			"es",
			"es6",
			"mjs",
			"jsx",
		].includes(type)) {
			return "general";
		}
		
		if ([
			"json",
			"json5",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	}
}

module.exports = async function() {
	let javascript = new JavaScript();
	
	await javascript.init();
	
	return javascript;
}
