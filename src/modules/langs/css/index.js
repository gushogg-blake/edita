let astMode = require("./astMode");
let codeIntel = require("./codeIntel");
let parse = require("./parse");

class CSS {
	constructor() {
		this.code = "css";
		this.name = "CSS";
		this.astMode = astMode;
		this.codeIntel = codeIntel;
	}
	
	async init() {
		this.parse = await parse(this);
	}
	
	getHiliteClass(node) {
		let {type, parent} = node;
		
		if (type === "tag_name") {
			return "tagName";
		}
		
		if (type === "class_name") {
			return "className";
		}
		
		if (type === "id_name" || type === "#" && parent?.type === "id_selector") {
			return "idName";
		}
		
		if (type === "property_name") {
			return "property";
		}
		
		if (type === "string_value") {
			return "string";
		}
		
		if (type === "color_value") {
			return "colour";
		}
		
		if (type === "float_value" || type === "integer_value") {
			return "number";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		return "symbol";
	}
	
	getSupportLevel(code, path) {
		let type = platform.fs(path).lastType;
		
		if ([
			"css",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}

module.exports = async function() {
	let css = new CSS();
	
	await css.init();
	
	return css;
}
