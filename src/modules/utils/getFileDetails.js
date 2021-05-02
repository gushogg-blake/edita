let langs = require("../langs");
let guessIndent = require("./guessIndent");
let guessLang = require("./guessLang");

module.exports = function(prefs, code, path) {
	let indent = guessIndent(code) || prefs.defaultIndent;
	let lang = guessLang(code, path) || langs[prefs.defaultLang];
	
	let indentation = {
		str: indent,
		re: new RegExp("^(" + indent + ")*"),
	};
	
	return {
		indentation,
		lang,
	};
}
