let langs = require("../langs");
let guessIndent = require("./guessIndent");
let guessLang = require("./guessLang");
let guessNewline = require("./guessNewline");

module.exports = function(prefs, code, path) {
	let {
		defaultLang,
		defaultIndent,
		tabWidth,
		defaultNewline,
	} = prefs;
	
	let indent = guessIndent(code) || defaultIndent;
	let lang = guessLang(code, path) || langs[defaultLang];
	let indentType = indent[0] === "\t" ? "tab" : "space";
	let newline = guessNewline(code) || defaultNewline;

	let indentation = {
		str: indent,
		re: new RegExp("^(" + indent + ")*"),
		colsPerIndent: indentType === "tab" ? indent.length * tabWidth : indent.length,
	};
	
	return {
		indentation,
		tabWidth,
		lang,
		newline,
	};
}
