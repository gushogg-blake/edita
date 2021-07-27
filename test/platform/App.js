let Evented = require("../src/utils/Evented");

let guessIndent = require("../src/modules/utils/guessIndent");
let checkNewlines = require("../src/modules/utils/checkNewlines");

let js = require("../src/modules/langs/js");
let langs = require("../src/modules/langs");

function defaultPrefs() {
	return {
		font: "14px DejaVu Sans Mono",
		tabWidth: 4,
		defaultIndent: "\t",
		defaultNewline: "\n",
		lineNumberColor: "#9f9f9f",
		marginBackground: "#f0f0f0",
		selectionBackground: "#d0d0d0",
		astSelectionBackground: "#c5e4ff",
		astSelectionHiliteBackground: "#F2F2F2",
		astInsertionHiliteBackground: "#606060",
		wrap: true,
		modeSwitchKey: "Escape",
		minHoldTime: 200,
		
		langs: {
			js: {
				colors: {
					keyword: "#aa33aa",
					id: "#202020",
					comment: "#7f7f7f",
					symbol: "#bb22bb",
					bracket: "#202020",
					number: "#cc2222",
					string: "#2233bb",
					regex: "#cc7030",
				},
			},
		},
		
		cursorBlinkPeriod: 700,
	};
}

class App extends Evented {
	constructor() {
		super();
		
		this.prefs = defaultPrefs();
		this.langs = langs;
	}
	
	async init() {
		let langs = await Promise.all([
			js(),
			//html(),
		]);
		
		for (let lang of langs) {
			this.langs.add(lang.code, lang);
		}
	}
	
	guessLang(code, path) {
		return this.langs.get("js"); // DEV
	}
	
	getFileDetails(code, path) {
		let {
			defaultLang,
			defaultIndent,
			tabWidth,
			defaultNewline,
		} = this.prefs;
		
		let indent = guessIndent(code) || defaultIndent;
		let lang = this.guessLang(code, path) || this.langs.get(defaultLang);
		let indentType = indent[0] === "\t" ? "tab" : "space";
		
		let {
			mixed: hasMixedNewlines,
			mostCommon: newline,
		} = checkNewlines(code);
		
		if (!newline) {
			newline = defaultNewline;
		}
	
		let indentation = {
			string: indent,
			re: new RegExp("^(" + indent + ")*"),
			colsPerIndent: indentType === "tab" ? indent.length * tabWidth : indent.length,
		};
		
		return {
			indentation,
			tabWidth,
			lang,
			newline,
			hasMixedNewlines,
		};
	}
}

module.exports = App;
