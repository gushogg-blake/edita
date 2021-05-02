let langs = require("../langs");
let guessIndent = require("./guessIndent");
let guessLang = require("./guessLang");

module.exports = function(prefs, code, path) {
	let {
		defaultLang,
		defaultIndent,
		tabWidth,
	} = prefs;
	
	let indent = guessIndent(code) || defaultIndent;
	let lang = guessLang(code, path) || langs[defaultLang];
	let indentType = indent.includes("\t") ? "tab" : "space";
	
	let indentation = {
		str: indent,
		re: new RegExp("^(" + indent + ")*"),
		colsPerIndent: indentType === "tab" ? indent.length * tabWidth : indent.length,
	};
	
	return {
		indentation,
		tabWidth,
		lang,
	};
}
