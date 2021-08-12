let astMode = require("./astMode");
let codeIntel = require("./codeIntel");
let parse = require("./parse");

class HTML {
	constructor() {
		this.code = "html";
		this.name = "HTML";
		this.astMode = astMode;
		this.codeIntel = codeIntel;
	}
	
	async init() {
		this.parse = await parse(this);
	}
	
	getHiliteClass(node) {
		let {type} = node;
		
		if ([
			"<",
			">",
			"/>",
			"</",
			"tag_name",
		].includes(type)) {
			return "tag";
		}
		
		if (type === "attribute_name") {
			return "attribute";
		}
		
		if (type === "quoted_attribute_value") {
			return "string";
		}
		
		return "text";
	}
	
	getSupportLevel(code, path) {
		let type = platform.fs(path).lastType;
		
		if ([
			"html",
			"htm",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}

module.exports = async function() {
	let html = new HTML();
	
	await html.init();
	
	return html;
}
